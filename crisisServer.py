# run the script and then point your browser to localhost: http://localhost:8080/
# if you're not sure if it's working, uncomment the test (right under the imports)
# and point your browser to: http://localhost:8080/test


from bottle import run, get, post, request
from pymongo import MongoClient
import pymongo
import json
from bson import Binary, Code
from bson.json_util import dumps
from bottle import static_file

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
    if num == 0:
            return '{"tweets": []}'
    num_t = tweets.find().sort("uuid", pymongo.DESCENDING).limit(num)
    ret = '{"tweets":['
    c = 0
    for t in num_t:
        c += 1
        json_t = dumps(t)
        ret += json_t + "," # concatenating in this order puts them from [most recent --> least recent]
    if (c != 0):
        ret = ret[:-1]
    ret += ']}'
    return ret

@get('/tweets/since/<tweetID:int>')
def tweetsSince(tweetID):
    t_since = tweets.find({'uuid' : {'$gt': tweetID}}).sort("uuid", pymongo.DESCENDING)
    ret = '{"tweets":['
    c = 0
    for t in t_since:
        c += 1
        json_t = dumps(t)
        ret += json_t + "," # concatenating in this order puts them from [most recent --> least recent]
    if (c != 0):
        ret = ret[:-1]
    ret += ']}'
    return ret

@get('/tweets/before/<tweetID:int>')
def tweetsBefore(tweetID):
    return '20 tweets before ' + str(tweetID)


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
    #TODO(Camille): Check to see if client is already in DB and return the previous id
    # and don't add again  
    instance_document = {'Name': client_name}
    generated_id = clients.insert(instance_document)
    return '{"generated_id": "' + str(generated_id) + '"}'

# ---- Other interactions with clients ----

## I can't think of anything else. 

###################### TAGS #####################################

# ---- For clients to add new tags ----

@get('/newtag')
def newTag_form():
    return '''
    <form action="/newtag" method="post">
      Tag Name: <input name="tag_name" type="text" />
      Color: <input name="color" type="text" />
      Created At: <input name="created_at" type="text" /> 
      Created By: <input name="created_by" type="text" />
      Tag ID: <input name="tag_id" type="int" />
      <input value="Add tag" type="submit" />
    </form>
    '''

@post('/newtag')
def newTag():
    tag_name = request.forms.get("tag_name")
    tag_color = request.forms.get("color")
    tagID = request.forms.get("tag_id")
    created_At = request.forms.get("created_at")
    created_By = request.forms.get("created_by")
    tag_document = {'Color': tag_color, 
                    'Created_At': datetime.datetime(2013, 10, 9, 4, 50, 54),
                    'Created_By': created_By, 
                    'Tag_ID': tagID, 
                    'Tag_Name': tag_name}
    # check to see if already in db?
    generated_id = tags.insert(tag_document)

    return generated_id

# ---- For clients to get Tags from DB ----

@get('/tags')
def tags():
    all_tags = tags.find()
    ret = ''
    for t in all_tags: 
        ret += str(t)
    return ret

## might want one to get tags only since the last tag was created (like tweets/since)
## but might not need it since we expect there will always be a small number of tags

# ---- Other interactions with tags (but no other tables) ----

## method for changing tag color? 
# get tagID from frontend
# get new color from frontend
# lookup that db entry, update it.
# return true if successful.

## method for getting all tags of a certain color
# get color from frontend
# return json of tags OR list of tagIDs (coordinate with frontend for this choice)

## method for getting a tag by its ID
# get tagID from frontend
# return json of tag

## method for getting all tags created between time T1 and time T2
# get times from frontend (coordinate with frontend to decide what format -- datetime?)
#    for format, it should be the same format they are giving time when they send tweets/tags
#    and it should be the a format that works with greater than/less than queries
#    OR we (before storing/looking up) need to do conversions
# have option for T2 to be unspecified = goes up til now
# have option for T1 to be unspecified = from the beginning up until T2
# return json of tags OR list of tagIDs (coordinate with frontend for this choice)

## dealing with deleting tags (but keeping records of them)??? 
# we will probably need to talk more about this as a group before doing anything about it

# ---- Interactions with tags and clients (and no other tables) ----

## method for getting all tags by a certain client
# get clientID from frontend
# return json

# ---- Interactions with tags and tweets (and no other tables)----

## I can't think of anything

## anything else?
# eventually, we'll add something with tags and/or tag instances to tag twitter users instead of just tweets

###################### TAG INSTANCES #####################################

# ---- For clients to add new tag instances ----

@get('/newtaginstance')
def newTagInstance_form():
    return '''
    <form action="/newtaginstance" method="post">
      Tag ID: <input name="tag_id" type="int" />
      Tweet ID: <input name="tweet_id" type="int" />
      Instance ID: <input name="instance_id" type="int" />
      Created At: <input name="created_at" type="text" /> 
      Created By: <input name="created_by" type="text" />
      <input value="Add tag instance" type="submit />
    </form>
    '''

@post('/newtaginstance')
def newTagInstance():
    created_at = request.forms.get("created_at")
    created_by = request.forms.get("created_by")
    tag_id = request.forms.get("tag_id")
    tweet_id = request.forms.get("tweet_id")
    instance_id = request.forms.get("instance_id")
    instance_document = {'Created_At': datetime.datetime(2013, 10, 9, 4, 52, 1),
                         'Created_By': created_by,
                         'Tag_ID': tag_id,
                         'Tag_Instance_ID': instance_id,
                         'Tweet_ID': tweet_id}
    generated_id = tags.insert(instance_document)
    return generated_id

# ---- For clients to get Tag Instances ----

@get('/taginstances')
def tagInstances():
    all_tag_instances = tag_instances.find()
    ret = ''
    for t in all_tag_instances: 
        ret += str(t)
    return ret

@get('/taginstances/since/<tagInstanceID:int>')
def tagInstancesSince(tagInstanceID):
    t_instances_since = tag_instances.find({'Tag_Instance_ID' : {'$gt': tagInstanceID}})
    ret = ''
    for t in t_since: 
        ret += str(t)
    return ret

# ---- Interactions with tags instances (but no other tables) ----

## method for getting a tag instance by its ID
# get tagInstanceID from frontend
# return json of tag

## method for getting all tag instances associated with a specific tweet
# get tweetID from frontend
# return json of tag

## method for getting all tag instances created between time T1 and time T2
# get times from frontend (coordinate with frontend to decide what format -- datetime? -- same as above!)
# have option for T2 to be unspecified = goes up til now
# have option for T1 to be unspecified = from the beginning up until T2
# return json of tags OR list of tagIDs (coordinate with frontend for this choice)


# ---- Interactions with tags instances and tweets (but no other tables) ----

## ? 


# ---- Interactions with tags instances and clients (but no other tables) ----

## method for getting all tag instances by a certain client
# get clientID from frontend
# return json


# ---- Interactions with tags instances and tags (but no other tables) ----

## method for getting all tags instances with a certain tag
# get tagID from frontend
# return json of tag instances OR list of tagInstnaceIDs (coordinate with frontend for this choice)


# ---- Interactions with more than 2 tables? ----

## ?

## anything else with tag instances? anything else at all? 
# eventually, we'll add something with tags and/or tag instances to tag twitter users instead of just tweets, 
# but on the backend we're going to put those in a new table (even if we represent the tags the same way on the frontend) 

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
