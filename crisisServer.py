# run the script and then point your browser to localhost: http://localhost:8080/
# if you're not sure if it's working, uncomment the test (right under the imports)
# and point your browser to: http://localhost:8080/test


from bottle import run, get, post, request
from pymongo import MongoClient
import pymongo
import json
import datetime
import pytz
import random
import re
from bson import Binary, Code
from bson.json_util import dumps
from bson import objectid
from bottle import static_file


### get change-able info from config file! 
### __________________________________________________________ ### 
import config
system_configs = config.read_system_configs()

EVENT_TITLE = system_configs['event_title']
LIVE_DB_NAME = system_configs['current_database']
SERVER_HOST = system_configs['server_host']
SERVER_PORT = int(system_configs['server_port'])

### __________________________________________________________ ### 


"""
# a test that your server is running, uncomment this if you're having trouble
@get('/test')
def test():
    return 'This is just a test. This server is running as expected.'
"""


###################### TWEETS #####################################

# ---- For clients to get Tweets ----

# Adds a'columns' array to each tweet, which lists all the columns the tweet belongs to
def addCols(cols, tweet_list):
	for tweet in tweet_list:
		tweet["columns"] = []
		for col in cols:
			search = col['search']
			searchType = col['search']['searchType'].decode('utf-8')
			if(not col['started']):
				continue
			if(searchType   == 'text'):
				searchText = col['search']['text'].decode('utf-8')
				if not findWholeWord(searchText)(tweet["text"]):
					continue
			elif(searchType == 'users'):
				if not tweetedByUser(search, tweet): # TODO allow filtering by multiple users
					continue
			elif(searchType == 'tags'):
				if not containsTags(search, tweet):
					continue

			elif(searchType == 'user_tags'):
				# filter by User Tags
				if not containsUserTags(search, tweet):
					continue
			tweet["columns"].append(col["colId"])

# Returns whether this tweet was tweeted by the user in the given search
def tweetedByUser(search, tweet):
	user = tweet["user"]["screen_name"]
	if len(search["users"]) < 1:
		return False
	searchUser  = search["users"][1:] if search["users"][0] == "@" else search["users"] # get rid of @ sign
	return user == searchUser

# Returns whether this tweet contains the tags in the given search
def containsTags(search, tweet):
	searchTags = search['tags']
	for searchTag in searchTags.keys():
		if searchTags[searchTag]:
			tweetTags = tweet.get("tags")
			if tweetTags == None or searchTag not in tweetTags:
				return False
	return True


# Returns whether this tweet contains the user tags in the given search
def containsUserTags(search, tweet):
	searchTags = search['userTags']
	for searchTag in searchTags.keys():
		if searchTags[searchTag]:
			tweetTags = tweet.get("user_tags")
			if tweetTags == None or searchTag not in tweetTags:
				return False
	return True
		

@post('/tweets/<num:int>')
def tweetNum(num):
	if(num < 0):
		return '{"error": { "message": "Number of tweets requested cannot be negative"}}'
	
	cols = json.loads(request.body.read())["cols"]
	tweet_list = list(tweets.find().sort("id", pymongo.DESCENDING).limit(num))
	addCols(cols, tweet_list)
	time = currentTime(); 		
	return '{"tweets": ' + dumps(tweet_list) +  ', "created_at" :' + dumps(time) + ' }'

@post('/tweets/since/<tweetID>')
def tweetsSince(tweetID):
	tweet = tweets.find({"id_str" : tweetID})
	if(tweet.count() == 0):
		return '{"error": { "message": "Tweet id does not exist"}}'
	
	cols = json.loads(request.body.read())["cols"]
	t_since = list(tweets.find({'id_str' : {'$gt': tweetID}}).sort("id", pymongo.DESCENDING))
	addCols(cols, t_since)

	return '{"tweets": ' + dumps(t_since) + '}'

@get('/tweets/before/<tweetID:int>')
def tweetsBefore(tweetID):
	tweet = tweets.find({"id_str" : tweetID})
	if(tweet.count() > 0):
		t_before = tweets.find({'id_str' : {'$lt': tweetID}}).sort("id", pymongo.DESCENDING)

		return '{"tweets": ' + dumps(t_before) + '}'
	else:
		return '{"error": { "message": "Tweet id does not exist"}}'

# returns tweets to fill a new column
@post('/tweets/colId/')
def tweetsByColumn():
	col = json.loads(request.body.read())["col"]
	search = col['search']
	searchType = col['search']['searchType'].decode('utf-8')

	tweet_list = tweets.find()
	result = []
	for tweet in tweet_list:
		tweet["columns"] = []
		if(searchType   == 'text'):
			searchText = col['search']['text'].decode('utf-8')
			if not findWholeWord(searchText)(tweet["text"]):
				continue
		elif(searchType == 'users'):
			if not tweetedByUser(search, tweet): # TODO allow filtering by multiple users
				continue
		elif(searchType == 'tags'):
			if not containsTags(search, tweet):
				continue
		elif(searchType == 'user_tags'):
			# filter by User Tags
			if not containsUserTags(search, tweet):
				continue
		tweet["columns"].append(col["colId"])
		result.append(tweet)
		if(len(result) > 70): # TODO replace with constant
			break
	result = sorted(result, key=lambda k: k['id'])
	return '{"tweets": ' + dumps(result) + ' }'

# Creates a new column search term to filter tweets by
@post('/newcolumn')
def newColumn():
	col_id = json.loads(request.body.read())["colId"]
	user_id = json.loads(request.body.read())["user"]
	text = json.loads(request.body.read())["search"]["text"].decode('utf-8')
	col_document = {'colId': str(col_id), 'user': str(user_id), 'text': text}
	generated_id =  columns.insert(col_document)
	if(generated_id > 0):
		return '{"id": "' + str(generated_id) + '"}'
	else:
		return '{"error": { "message": "Column not added"}}'

# deletes a column 
@post('/deletecolumn')
def newColumn():
	col_id = json.loads(request.body.read())["colId"]
	user_id = json.loads(request.body.read())["user"]
	col_document = {'colId': int(col_id), 'user': str(user_id)}
	columns.remove(col_document)
	

@get('/columns/<userID>')
def columns(userID):
	instance = {'user': str(userID)}
	cols = columns.find(instance)
	return '{"columns":' + dumps(cols) + '}'



@get('/columns')
def columns():
	cols = columns.find()
	return '{"columns":' + dumps(cols) + '}'

###################### CLIENTS #####################################

# ---- Methods for getting user name from client ----

@get('/clientName')
def clientName_form():
    return '''
    <form action="/clientName" method="post">
      Client Name: <input name="client_name" type="text" />
    </form>
    '''

@post('/clientName')
def clientName():
    client_name = json.loads(request.body.read())["client_name"] 
    instance = {'Name': client_name}
    client = clients.find(instance)
    if(client.count() > 0):
		return '{"id": "' + str(client[0]["_id"]) + '"}'
    else:
    	return '{"id": "' + str(clients.insert(instance)) + '"}'

# ---- Other interactions with clients ----

@get('/clients')
def clients():
    peeps = clients.find()
    return '{"clients":' + dumps(peeps) + '}'


###################### TAG MODELS #####################################
'''
	Mongo Data representation

	tweets collection:
	Each tweet contains two tag lists, that represent tags that have been
    applied to this tweet. One for tweet tags (tags), and one for user tags (user_tags).
	tweet
	{
		tags: []
		user_tags: []
	}


	tags and user_tags collections:
	The tags collection represents tweet tags.
	The user_tags collection represents user tags.
	Each tag contains a list of all the items that have been tagged with this tag.
	tag
	{
		created_at: date
		created_by: user_id
		color: color
		tag_name: name
		tagged_item_ids: []     # either tweet IDs or Twitter User IDs, depending on the type of tag
		active: True			# True if this tag is not deleted
	}



	tag_instance and user_tag_instance collections:
	These represent applied istances of tags
	tag instance
	{
		tagged_item_id:			# either a tweet ID or Twitter User ID, depending on the type of tag	
		tag_id:	
		created_at:
		created_by:
		active: True
	}
'''

class TagsModel:
	def getTags(self):
		all_tags = list(self.tags.find({'active': True}, {'tag_name': 1, 'color': 1, '_id': 1,'created_by': 1}))
		return '{"tags":' + dumps(all_tags) + '}'

	def newTag(self):
		tag_name = json.loads(request.body.read())["tag_name"]
		tag_color = json.loads(request.body.read())["color"]
		created_by = json.loads(request.body.read())["created_by"]

		# check if tag already exists
		tag_instance = self.tags.find({'tag_name': tag_name})
		if(tag_instance.count() > 0):
		    return '{"id": "' + str(tag_instance[0]["_id"]) + '"}'
	
		tag_document = self.tagDocument(tag_name, tag_color, created_by)

		generated_id = self.tags.insert(tag_document)
		return '{"id": "' + str(generated_id) + '"}'

	def deleteTag(self):
		created_by = json.loads(request.body.read())["created_by"]
		tag_id = json.loads(request.body.read())["tag_id"]

		# remove embedded tags from tweets collection
		self.removeEmbeddedData(tag_id)

		# inactivate instances of this tag
		self.tag_instances.update({'tag_id' : tag_id}, {'$set' :{'active': False, 'created_at': currentTime() }})

	def changeColor(self):
		new_color = json.loads(request.body.read())["color"]
		tagID = json.loads(request.body.read())["tag_id"]

		tag = getInstanceByObjectID(tagID, self.tags)
		if(tag):
		    self.tags.update({'_id': objectid.ObjectId(tagID)},
						{'$set': { 'color' : new_color }})
		    return 'true'			
		else:
		    return '{"error": { "message": "Tag id does not exist"}}'

	def changeText(self):
		new_text = json.loads(request.body.read())["text"]
		tagID = json.loads(request.body.read())["tag_id"]
		tag = getInstanceByObjectID(tagID, self.tags)
		if(tag):
		    self.tags.update({'_id': objectid.ObjectId(tagID)},
		      {'$set': { 'tag_name' : new_text }})
		    return 'true'     
		else:
		    return '{"error": { "message": "Tag id does not exist"}}'

	def tagDocument(self, tag_name, tag_color, created_by):
		return { 'tag_name': tag_name,
				'created_at': currentTime(),
		        'created_by': created_by,
		        'color': tag_color,
				'tagged_item_ids': [],
		        'active': True } 

	def addEmbeddedData(self, tag_id, tagged_item_id):
		# add tag to list of tagged tweets' tags	
		tweets.update(self.taggedTweets(tagged_item_id), 
					 {'$push' : { self.embedded_array_name :  tag_id } }, multi=True)
		# add tagged item to list of this tag's tagged items
		self.tags.update({'_id' : objectid.ObjectId(tag_id)}, 
					     {'$push' : { 'tagged_item_ids' : tagged_item_id} } )

	def removeEmbeddedData(self, tag_id):
		tag = self.tags.find({'_id' : objectid.ObjectId(tag_id)})
		# remove tag from tagged tweets' tags
		if(tag.count() > 0):
		    for tagged_item_id in tag[0]["tagged_item_ids"]:
				tweets.update(self.taggedTweets(tagged_item_id), 
							  {'$pull': { self.embedded_array_name : tagged_item_id}}, multi=True)	

		# clear this tag's list of tagged items
		self.tags.update({'_id' : objectid.ObjectId(tag_id)}, {'tagged_item_ids' : [] } )


	def newTagInstance(self):
		created_by = json.loads(request.body.read())["created_by"]
		tag_id = json.loads(request.body.read())["tag_id"]
		tagged_item_id = json.loads(request.body.read())["tagged_item_id"]

		tag_instance_id = None
		# Tag instance exists. Update.
		tag_instance = self.tag_instances.find({'tagged_item_id': tagged_item_id })
		if(tag_instance.count() > 0):
		    self.tag_instances.update({'tagged_item_id': tagged_item_id},
		                         {'$set' : {'tag_id': tag_id,'created_at' : currentTime(), 
		                                    'created_by': created_by, 'active': True } })	
		else:
			# Tag instance does not exist.  Create.
			instance_document = {'tagged_item_id' : tagged_item_id,
				                 'created_at': currentTime(),
				                 'created_by': created_by,
				                 'tag_id': tag_id,
				                 'active': True}

			tag_instance_id = self.tag_instances.insert(instance_document)
		
		self.addEmbeddedData(tag_id, tagged_item_id);
		return '{"id": "' + str(tag_instance_id) + '"}'

	def deleteTagInstance(self):
		created_by = json.loads(request.body.read())["created_by"]
		tag_id = json.loads(request.body.read())["tag_id"]
		tagged_item_id = json.loads(request.body.read())["tagged_item_id"]
		
		# Update timestamp so this update will propogate to other systems as they pull for changes
		tag_instance = self.tag_instances.find({'tag_id' : tag_id, 'tagged_item_id': tagged_item_id});
		if(tag_instance.count() > 0):
		    tag_instance_id = tag_instance[0]["_id"]
		    self.tag_instances.update({'_id' : tag_instance_id },
		                         	  {'$set' : {'created_at' : currentTime(), 
		                                         'created_by': created_by, 
									             'active': False }})	

		# update embedded lists in tweets, tag
		tweets.update(self.taggedTweets(tagged_item_id),
			          {'$pull' : { self.embedded_array_name :  tag_id } }, multi=True)
		self.tags.update({'_id' : objectid.ObjectId(tag_id)}, 
	                     {'$pull' : { 'tagged_item_ids' : tagged_item_id} } )


	# Return tag instances since the given date
	def tagInstancesSince(self):
		last_update = json.loads(request.body.read())["date"]
		tagInstances = self.tag_instances.find({'created_at' : {'$gt': last_update }})
	
		if(tagInstances.count() > 0):
		    last_update = tagInstances[0]['created_at'];

		if(tagInstances):
		    return '{"tag_instances":' + dumps(tagInstances) + ', "created_at": "' + last_update + '"}'


class TweetTagsModel(TagsModel):
	def __init__(self):
		self.tags = tags
		self.tag_instances = tag_instances
		self.embedded_array_name = 'tags'

	def taggedTweets(self, tagged_item_id):
		# query to find all tweets that are tagged with this tag
		return { '_id' : objectid.ObjectId(tagged_item_id) }

	def getTags(self):
		all_tags = list(self.tags.find({'active': True}, {'tag_name': 1, 'color': 1, 'tagged_item_ids': 1, 'created_by': 1}))
		for tag in all_tags:
		    tag["num_instances"] = len(tag["tagged_item_ids"])
		    del tag["tagged_item_ids"] # no need to send embedded tweets
		return '{"tags":' + dumps(all_tags) + '}'


class UserTagsModel(TagsModel):
	def __init__(self):
		self.tags = user_tags
		self.tag_instances = user_tag_instances
		self.embedded_array_name = 'user_tags'

	def taggedTweets(self, tagged_item_id):
		# query to find all tweets that are tagged with this tag
		return { 'user.id' : tagged_item_id }


###################### TAGS #####################################
@post('/newtag')
def newTag():
	return tweetTags.newTag()

@post('/newusertag')
def newUserTag():
	return userTags.newTag()

@post('/deletetag')
def deleteUserTag():
	return tweetTags.deleteTag()

@post('/deleteusertag')
def deleteUserTag():
	return userTags.deleteTag()

@post('/tags/changeColor')
def changeUserTagColor():
	return tweetTags.changeColor()

@post('/usertags/changeColor')
def changeUserTagColor():
	return userTags.changeColor()

@post('/tags/changeText')
def changeUserTagText():
	return tweetTags.changeText()

@post('/usertags/changeText')
def changeUserTagText():
    return userTags.changeText()

@get('/tags')
def getTags():
	return tweetTags.getTags()

@get('/usertags')
def getUserTags():
	return userTags.getTags()

###################### TAG INSTANCES #####################################

@post('/newtaginstance')
def newTagInstance():
	return tweetTags.newTagInstance()

@post('/newusertaginstance')
def newUserTagInstance():
	return userTags.newTagInstance()

@post('/deletetaginstance')
def deleteTagInstance():
	return tweetTags.deleteTagInstance()

@post('/deleteusertaginstance')
def deleteUserTagInstance():
	return userTags.deleteTagInstance()

@post('/taginstances/since')
def tagInstancesSince():
	return tweetTags.tagInstancesSince()

@post('/usertaginstances/since')
def userTagInstancesSince():
	return userTags.tagInstancesSince()


## method for getting all tag instances associated with a specific tweet
@get('/taginstances/tweetID/<tweetID:path>') 
def tagInstancesByTweetID(tweetID):
	tweet = getInstanceByObjectID(tweetID, tweets)
	if(tweet):
		t_instances_since = tag_instances.find({'Tweet_ID' : tweetID })
		return '{"tag_instances":' + dumps(t_instances_since) + '}'
	else:
		return '{"error": { "message": "Tweet id does not exist"}}'

## method for getting all tags instances with a certain tag
@get('/taginstances/tagID/<tagID:path>')
def tagInstancesByTagID(tagID):
	tag = getInstanceByObjectID(tagID, tags)
	if(tag):
		t_instances = tag_instances.find({'Tag_ID' : tagID })
		return '{"tags_instances":' + dumps(t_instances) + '}'
	else:
		return '{"error": { "message": "Tag id does not exist"}}'


###################### HELPER METHODS #####################################

# Returns the instance from collection with the given Object ID
# Returns None if no such object exists
def getInstanceByObjectID(id, collection):
	try:
		oid = objectid.ObjectId(id)
	except Exception:
		return None
	instance = collection.find({'_id': oid })
	if(instance.count() > 0):
		return instance[0]
	else:
		return None

# Returns current Datetime, as a string
def currentTime():
	return datetime.datetime.now(pytz.timezone('US/Pacific')).strftime('%Y%m%d%H%M%S')


def findWholeWord(w):
    return re.compile(r'\b({0})\b'.format(w), flags=re.IGNORECASE).search

###################### STATIC FILES #####################################

# --- Serve static files ---

@get('/')
def index():
	return static_file('index.html', root="")

@get('/<path:re:.*\.html>')
def get_html(path):
	return static_file(path, root="")

@get('/<folder:re:(css|js|fonts|assets)>/<filename:path>')
def get_static(folder, filename):
	return static_file(filename, root=folder)

@get('/eventTitle')
def get_eventTitle():
	return EVENT_TITLE


###################### RUNNING CODE (NON-METHODS) #####################################

# ---- Opening the Database ----

dbclient =  MongoClient('localhost', 27017)

db = dbclient[LIVE_DB_NAME]

tweets = db.tweets
tags = db.tags
tag_instances = db.tag_instances
user_tags = db.user_tags
user_tag_instances = db.user_tag_instances
clients = db.clients
columns = db.columns

tweetTags = TweetTagsModel()
userTags = UserTagsModel()

# ---- Starting the Server ----

run(host=SERVER_HOST, port=SERVER_PORT, debug=True)
