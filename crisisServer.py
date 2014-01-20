# run the script and then point your browser to localhost: http://localhost:8080/
# if you're not sure if it's working, uncomment the test (right under the imports)
# and point your browser to: http://localhost:8080/test


from bottle import run, get, post, request
from pymongo import MongoClient
import pymongo
import json
import datetime
import pytz
from bson import Binary, Code
from bson.json_util import dumps
from bson import objectid
from bottle import static_file

"""
# a test that your server is running, uncomment this if you're having trouble
@get('/test')
def test():
    return 'This is just a test. This server is running as expected.'
"""

###################### TWEETS #####################################

# ---- For clients to get Tweets ----

@get('/tweets/<num:int>')   # TODO: decide if we should deal differently with the case where there are less than num tweets
def tweets(num):
    if num == 0:
            return '{"tweets": []}'
    num_t = tweets.find().sort("uuid", pymongo.DESCENDING).limit(num)
    ret = '{"tweets":['
    c = 0
    for t in num_t:
        c += 1
        json_t = dumps(t)
        ret += json_t + "," # concatenating and sorting this way: [most recent --> least recent]
    if (c != 0):
        ret = ret[:-1]
    ret += ']}'
    return ret

@get('/tweets/since/<tweetID:int>') # TODO: deal with the case where there is no tweet with that ID predictably (ex. return false or nothing, but make it definitive)
def tweetsSince(tweetID):
    t_since = tweets.find({'uuid' : {'$gt': tweetID}}).sort("uuid", pymongo.DESCENDING)
    ret = '{"tweets":['
    c = 0
    for t in t_since:
        c += 1
        json_t = dumps(t)
        ret += json_t + "," # concatenating and sorting this way: [most recent --> least recent]
    if (c != 0):
        ret = ret[:-1]
    ret += ']}'
    return ret

@get('/tweets/before/<tweetID:int>') # TODO: deal with the case where there is no tweet with that ID predictably (see above)
def tweetsBefore(tweetID):
    # TODO: write this query, add into json list, update return value
    return '{"tweets":[]}'

## do we want one to get a specific tweet (i.e., by ID)? 


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
    peeps = clients.find(instance)
    if(peeps.count() > 0):
		return '{"id": ' + str(peeps[0]["_id"]) + '}'
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
   tag_name = request.forms.get("tag_name")
   tag_color = request.forms.get("color")
   created_By = request.forms.get("created_by")
   tag_document = {'Color': tag_color, # Use hex form; e.g."#FF00FF'
                    'Created_At': datetime.datetime.now(pytz.timezone('US/Pacific')),
                    'Created_By': created_By, 
                    'Tag_Name': tag_name}
   tag = tags.find({'Tag_Name' : tag_name})
   if(tag.count() > 0):
      return '{"id": "' + str(tag[0]["_id"]) + '"}'
   else:
      generated_id = tags.insert(tag_document)
      return '{"id": "' + str(generated_id) + '"}'


# ---- For clients to get Tags from DB ----

@get('/tags')
def tags():
    all_tags = tags.find()
    return '{"tags":' + dumps(all_tags) + '}'

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
    new_color = request.forms.get("color")
    tagID = request.forms.get("tag_id")
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
    created_by = request.forms.get("created_by")
    tag_id = request.forms.get("tag_id")
    tweet_id = request.forms.get("tweet_id")
    instance_document = {'Created_At': datetime.datetime.now(pytz.timezone('US/Pacific')),
                         'Created_By': created_by,
                         'Tag_ID': tag_id,
                         'Tweet_ID': tweet_id}
	# TODO deal with case that client, tag, or tweet IDs do not exist
    generated_id = tag_instances.insert(instance_document)
    return str(generated_id)

# ---- For clients to get Tag Instances ----

@get('/taginstances')
def tagInstances():
    all_tags = tag_instances.find()
    return '{"tags_instances":' + dumps(all_tags) + '}'

# Return tag instances since the tag instance with given ID
@get('/taginstances/since/<tagInstanceID:path>')
def tagInstancesSince(tagInstanceID):
	tagInstance = getInstanceByObjectID(tagInstanceID, tag_instances)
	if(tagInstance):
		tagDate = tagInstance['Created_At']
		t_instances_since = tag_instances.find({'Created_At' : {'$gt': tagDate}})
		return '{"tags_instances":' + dumps(t_instances_since) + '}'
	else:
		return '{"error": { "message": "Tag instance id does not exist"}}'

# ---- Interactions with tags instances (but no other tables) ----

## method for getting all tag instances associated with a specific tweet
@get('/taginstances/tweetID/<tweetID:path>')
def tagInstancesByTweetID(tweetID):
	tweet = getInstanceByObjectID(tweetID, tweets)
	if(tweet):
		t_instances_since = tag_instances.find({'Tweet_ID' : tweetID })
		return '{"tags_instances":' + dumps(t_instances_since) + '}'
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

db = dbclient['current_database']
# db = dbclient['crisisdb']

tweets = db.tweets
tags = db.tags
tag_instances = db.tag_instances
clients = db.clients


# ---- Starting the Server ----

run(host='localhost', port=8080, debug=True)
