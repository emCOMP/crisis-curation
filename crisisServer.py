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
from bson import Binary, Code
from bson.json_util import dumps
from bson import objectid
from bottle import static_file


### get change-able info from config file! 
### __________________________________________________________ ### 
import config
system_configs = config.read_system_configs()

LIVE_DB_NAME = system_configs['current_database']
SERVER_HOST = system_configs['server_host']
SERVER_PORT = int(system_configs['server_port'])

### __________________________________________________________ ### 

#### Katlyn's possibly weird global
COLUMNS = []


"""
# a test that your server is running, uncomment this if you're having trouble
@get('/test')
def test():
    return 'This is just a test. This server is running as expected.'
"""

###################### TWEETS #####################################

# ---- For clients to get Tweets ----

@get('/tweets/<num:int>')
def tweets(num):
	time = currentTime(); 
	if(num < 0):
		return '{"error": { "message": "Number of tweets requested cannot be negative"}}'		
	tweet_instances = tweets.find().sort("id", pymongo.DESCENDING).limit(num)
	return '{"tweets": ' + dumps(tweet_instances) +  ', "created_at" :' + dumps(time) + ' }'


@get('/tweets/since/<tweetID:int>')
def tweetsSince(tweetID):
	tweet = tweets.find({"id" : float(tweetID)})
	if(tweet.count() > 0):
		t_since = tweets.find({'id' : {'$gt': tweetID}}).sort("id", pymongo.DESCENDING)
		return '{"tweets": ' + dumps(t_since) + '}'
	else:
		return '{"error": { "message": "Tweet id does not exist"}}'

@get('/tweets/before/<tweetID:int>')
def tweetsBefore(tweetID):
	tweet = tweets.find({"id" : tweetID})
	if(tweet.count() > 0):
		t_before = tweets.find({'id' : {'$lt': tweetID}}).sort("id", pymongo.DESCENDING)

		return '{"tweets": ' + dumps(t_before) + '}'
	else:
		return '{"error": { "message": "Tweet id does not exist"}}'

## do we want one to get a specific tweet (i.e., by ID)? 

"""Oh for taking all of those tweets, you're gonna have to loop through them, 
json dumps them, then it's a dictionary so you can just use tweet['col'] = <col> to add in a
column attribute. Maybe that's helpful? Or probably you already got it."""
# def addColumnInfo(tweet_instances):

# Creates a new column search term to filter tweets by
@post('/newcolumn')
def newColumn():
	col_name = json.loads(request.body.read())["col"]
	col_document = {'colname': col_name}
  COLUMNS.append(col_name)
	generated_id = 	columns.insert(col_document)
	if(generated_id > 0):
		return '{"id": "' + str(generated_id) + '"}'
	else:
		return '{"error": { "message": "Column not added"}}'

# For debugging only - see all columns I currently have
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

## I can't think of anything else necessary. 
# Maybe look up client by id? Probably not (and also I won't mention similar things for other entities)
# Maybe let the client change their name?
# Definitely don't need this yet, maybe ever.

###################### TAGS #####################################

# ---- For clients to add new tags ----

@get('/newtag')
def newTag_form():
    return '''
    <form action="/newtag" method="post">
      Tag Name: <input name="tag_name" type="text" />
      Color: <input name="color" type="text" />
      Created By: <input name="created_by" type="text" />
      <input value="Add tag" type="submit" />
    </form>
    '''

# Creates a new tag, returns ID of that tag.
# If a tag with this name already exists, returns the ID of that tag
@post('/newtag')
def newTag():
   tag_name = json.loads(request.body.read())["tag_name"]
   tag_color = json.loads(request.body.read())["color"]
   created_by = json.loads(request.body.read())["created_by"]
   tag_document = {'color': tag_color, # Use hex form; e.g."#FF00FF'
                    'created_at': datetime.datetime.now(pytz.timezone('US/Pacific')),
                    'created_by': created_by, 
                    'tag_name': tag_name,
                    'instances' : 0,
                    'tweets': []}
   tag = tags.find({'tag_name' : tag_name})
   if(tag.count() > 0):
      return '{"id": "' + str(tag[0]["_id"]) + '"}'
   else:
      generated_id = tags.insert(tag_document)
      return '{"id": "' + str(generated_id) + '"}'

# Deletes tag with the specified ID
@post('/deletetag')
def deleteTag():
    created_by = json.loads(request.body.read())["created_by"]
    tag_id = json.loads(request.body.read())["tag_id"]
	
    # remove embedded instances of tag in tweets collection
    tag = tags.find({'_id' : objectid.ObjectId(tag_id)})
    if(tag.count() > 0):
        for tweet_id in tag[0]["tweets"]:
            tweets.update({'_id' : objectid.ObjectId(tweet_id)}, 
                          {'$pull' : { 'tags' :  tag_id } })
            # update time so that this change gets propagated
            tweets.update({'_id' : objectid.ObjectId(tweet_id)}, 
                          {'$set' : {'created_at' : currentTime(), 'active': False }})

    # inactivate instances of this tag
    tag_instances.update({'tag_id' : tag_id}, 
                         {'$set' :{'active': False, 'created_at': currentTime() }})

    # remove tag itself
    tags.remove({'_id' : objectid.ObjectId(tag_id)})

# ---- For clients to get Tags from DB ----

@get('/tags')
def tags():
    all_tags = tags.find({}, {'tag_name': 1, 'color': 1, 'css_class': 1, '_id': 1})
    return '{"tags":' + dumps(all_tags) + '}'  ## TODO: I need counts of each tag instance for each tag
                                               ## format is  "instances" : 34   etc.

## might want one to get tags only since the last tag was created (like tweets/since)
## but might not need it since we expect there will always be a small number of tags

# ---- Other interactions with tags (but no other tables) ----

@get('/tags/changeColor')
def changeTagColor_form():
    return '''
    <form action="/tags/changeColor" method="post">
      Tag ID: <input name="tag_id" type="text" />
      New Color: <input name="color" type="text" />
      <input value="Change color" type="submit" />
    </form>
    '''

@post('/tags/changeColor')
def changeTagColor():
    new_color = json.loads(request.body.read())["color"]
    tagID = json.loads(request.body.read())["tag_id"]
    tag = getInstanceByObjectID(tagID, tags)
    if(tag):
        tags.update({'_id': objectid.ObjectId(tagID)},
					{'$set': { 'Color' : new_color }})
        return 'true'	# TODO not sure what format of response should be			
    else:
        return '{"error": { "message": "Tag id does not exist"}}'

## hold off on this one - it's not important yet 
## we need to first figure out how we're passing time back/forth between frontend and backend and how we're storing it.
## method for getting all tags created between time T1 and time T2
# get times from frontend (coordinate with frontend to decide what format -- datetime?)
#    for format, it should be the same format they are giving time when they send tweets/tags
#    and it should be the a format that works with greater than/less than queries
#    OR we (before storing/looking up) need to do conversions
# have option for T2 to be unspecified = goes up til now
# have option for T1 to be unspecified = from the beginning up until T2
# return json of tags OR list of tagIDs (coordinate with frontend for this choice)

## hold off on this one - it is important, but we need to make group decisions
## dealing with deleting tags (but keeping records of them)??? 
# we will probably need to talk more about this as a group before doing anything about it

# ---- Interactions with tags and clients (and no other tables) ----

## get all tags by a certain client
@get('/tags/byClient/<clientID:path>') 
def tagsByClient(clientID):
	client = getInstanceByObjectID(clientID, clients)
	if(client):
		tagsByClient = tags.find({"Created_By": clientID})
		return '{"tags":' + dumps(tagsByClient) + '}'
	else:
		return '{"error": { "message": "Client id does not exist"}}'

# ---- Interactions with tags and tweets (and no other tables)----
## I can't think of anything

## anything else for tags?
# eventually, we'll add something with tags and/or tag instances to tag twitter users instead of just tweets but not yet
# that (on the back end at least) is going to mean adding a database table

###################### TAG INSTANCES #####################################

# ---- For clients to add new tag instances ----

@get('/newtaginstance')
def newTagInstance_form():
    return '''
    <form action="/newtaginstance" method="post">
      Tag ID: <input name="tag_id" type="text" />
      Tweet ID: <input name="tweet_id" type="text" />
      Created By: <input name="created_by" type="text" />
      <input value="Add tag instance" type="submit" />
    </form>
    '''

@post('/newtaginstance')
def newTagInstance():
    created_by = json.loads(request.body.read())["created_by"]
    tag_id = json.loads(request.body.read())["tag_id"]
    tweet_id = json.loads(request.body.read())["tweet_id"]

    # check if this tweet already has this tag
    tag_instance = tag_instances.find({'tag_id': tag_id, 'tweet_id': tweet_id})
    if(tag_instance.count() > 0):
        # TODO update timestamp, author
        return '{"id": "' + str(tag_instance[0]["_id"]) + '"}'
	
	# TODO deal with case that client, tag, or tweet IDs do not exist
    instance_document = {'created_at': currentTime(),
                         'created_by': created_by,
                         'tag_id': tag_id,
                         'tweet_id': tweet_id,
                         'active': True }
    generated_id = tag_instances.insert(instance_document)
    tweets.update({'_id' : objectid.ObjectId(tweet_id)}, {'$push' : { 'tags' :  tag_id } })
    tags.update({'_id' : objectid.ObjectId(tag_id)}, {'$push' : { 'tweets' : tweet_id} })

    return '{"id": "' + str(generated_id) + '"}'''


@post('/deletetaginstance')
def deleteTagInstance():
    created_by = json.loads(request.body.read())["created_by"]
    tag_id = json.loads(request.body.read())["tag_id"]
    tweet_id = json.loads(request.body.read())["tweet_id"]
    
    # Update timestamp so this update will propogate to other systems as they pull for changes
    tag_instance = tag_instances.find({'tag_id' : tag_id, 'tweet_id': tweet_id});
    if(tag_instance.count() > 0):
        tag_instance_id = tag_instance[0]["_id"]
        tag_instances.update({'_id' : tag_instance_id },
                             {'$set' : {'created_at' : currentTime(), 
                                        'created_by': created_by, 'active': False } })	

    tweets.update({'_id' : objectid.ObjectId(tweet_id)}, {'$pull' : { 'tags' :  tag_id } })
    tags.update({'_id' : objectid.ObjectId(tag_id)}, {'$pull' : { 'tweets' : tweet_id} })
    # TODO return some indicator of success or failure, process on frontend

# ---- For clients to get Tag Instances ----

@get('/taginstances')
def tagInstances():
    all_tags = tag_instances.find()
    return '{"tag_instances":' + dumps(all_tags) + '}'


# Return tag instances since the given date
@post('/taginstances/since')
def tagInstancesSince():
    last_update = json.loads(request.body.read())["date"]
    tagInstances = tag_instances.find({'created_at' : {'$gt': last_update }})
	
    if(tagInstances.count() > 0):
        last_update = tagInstances[0]['created_at'];

    if(tagInstances):
        return '{"tag_instances":' + dumps(tagInstances) + ', "created_at": "' + last_update + '"}'


# ---- Interactions with tags instances (but no other tables) ----

## method for getting all tag instances associated with a specific tweet
@get('/taginstances/tweetID/<tweetID:path>')
def tagInstancesByTweetID(tweetID):
	tweet = getInstanceByObjectID(tweetID, tweets)
	if(tweet):
		t_instances_since = tag_instances.find({'Tweet_ID' : tweetID })
		return '{"tag_instances":' + dumps(t_instances_since) + '}'
	else:
		return '{"error": { "message": "Tweet id does not exist"}}'

## don't do this yet. 
## method for getting all tag instances created between time T1 and time T2
# get times from frontend (coordinate with frontend to decide what format -- datetime? -- same as above!)
# have option for T2 to be unspecified = goes up til now
# have option for T1 to be unspecified = from the beginning up until T2
# return json of tags OR list of tagIDs (coordinate with frontend for this choice)


# ---- Interactions with tags instances and tweets (but no other tables) ----

## ? 


# ---- Interactions with tags instances and clients (but no other tables) ----

## method for getting all tag instances by a certain client
@get('/taginstances/clientID/<clientID:path>')
def tagInstancesByClientID(clientID):
	client = getInstanceByObjectID(clientID, clients)
	if(client):
		t_instances = tag_instances.find({'Created_By' : clientID })
		return '{"tags_instances":' + dumps(t_instances) + '}'
	else:
		return '{"error": { "message": "Client id does not exist"}}'


# ---- Interactions with tags instances and tags (but no other tables) ----

## method for getting all tags instances with a certain tag
@get('/taginstances/tagID/<tagID:path>')
def tagInstancesByTagID(tagID):
	tag = getInstanceByObjectID(tagID, tags)
	if(tag):
		t_instances = tag_instances.find({'Tag_ID' : tagID })
		return '{"tags_instances":' + dumps(t_instances) + '}'
	else:
		return '{"error": { "message": "Tag id does not exist"}}'

# ---- Interactions with more than 2 tables? ----

## ?

## anything else with tag instances? anything else at all? 
# eventually, we'll add something with tags and/or tag instances to tag twitter users instead of just tweets, 
# but on the backend we're going to put those in a new table (even if we represent the tags the same way on the frontend) 

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



###################### RUNNING CODE (NON-METHODS) #####################################

# ---- Opening the Database ----

dbclient =  MongoClient('localhost', 27017)

db = dbclient[LIVE_DB_NAME]

tweets = db.tweets
tags = db.tags
tag_instances = db.tag_instances
clients = db.clients
columns = db.columns


# ---- Starting the Server ----

run(host=SERVER_HOST, port=SERVER_PORT, debug=True)
