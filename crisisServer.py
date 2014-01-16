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
    #TODO: Query to see if client is already in DB 
    #      if so, return the already-generated id
    #      and don't add again  
    instance_document = {'Name': client_name}
    generated_id = clients.insert(instance_document)
    return '{"generated_id": "' + str(generated_id) + '"}'

# ---- Other interactions with clients ----

@get('/clients')
def clients():
    # TODO: Query to get all clients
    #       put in json list (see tweets above)
    return '{"clients":[]}'

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
    tag_document = {'Color': tag_color, #TODO: decide how we are representing color when we save it in the db - i suggest string of hex
                    'Created_At': datetime.datetime(2013, 10, 9, 4, 50, 54), #TODO: get the real time/date
                    'Created_By': created_By, 
                    'Tag_ID': tagID, 
                    'Tag_Name': tag_name}
    # TODO: check to see if already in db
    generated_id = tags.insert(tag_document)
    return '{"generated_id": "' + str(generated_id) + '"}'


# ---- For clients to get Tags from DB ----

@get('/tags') # TODO: this needs to be fixed to return json ... like before should be '{"tags":[]}' with tag jsons separated by commas inside the []
def tags():
    all_tags = tags.find()
    ret = ''
    for t in all_tags: 
        ret += str(t)
    return '{"tags":[]}'

## might want one to get tags only since the last tag was created (like tweets/since)
## but might not need it since we expect there will always be a small number of tags

# ---- Other interactions with tags (but no other tables) ----

@get('/tags/changeColor') # do we want to track when colors were changed? currently not set up to do this. 
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
    # TODO: figure out how to update the db entry. 
    #       deal with the case where there's no tag with that id (probably return false)
    return 'true'

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
@get('/tags/byClient/<clientID:int>') #TODO: figure out if this is actually an int or text or what ... 
def tagsByClient(clientID):
    # TODO: 
    # run query to get what you need, put it in json format
    # deal with the case where clientID isn't in the db ... not sure what the solution is, but do it predictably
    # and make it obvious so that we can change it later if needed 
    return '{"tags":[]}'

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
    instance_document = {'Created_At': datetime.datetime(2013, 10, 9, 4, 52, 1), #TODO: get the real date/time & decide on format
                         'Created_By': created_by,
                         'Tag_ID': tag_id,
                         'Tag_Instance_ID': instance_id,
                         'Tweet_ID': tweet_id}
    generated_id = tags.insert(instance_document)
    return generated_id

# ---- For clients to get Tag Instances ----

@get('/taginstances')  # TODO: this needs to be fixed to return json ... like before should be '{"tags_instances":[]}' with tag instance jsons separated by commas inside the []
def tagInstances():
    all_tag_instances = tag_instances.find()
    ret = ''
    for t in all_tag_instances: 
        ret += str(t)
    # return ret
    return '{"tag_instances":[]}'

@get('/taginstances/since/<tagInstanceID:int>') # TODO: this needs to be fixed to return json ... like before should be '{"tags_instances":[]}' with tag instance jsons separated by commas inside the []
def tagInstancesSince(tagInstanceID): # TODO: deal with the case where there's no tag with that id (probably return false? ex. {"tag_instances":"false"}???)
    t_instances_since = tag_instances.find({'Tag_Instance_ID' : {'$gt': tagInstanceID}})
    ret = ''
    for t in t_since: 
        ret += str(t)
    # return ret
    return '{"tag_instances":[]}'

# ---- Interactions with tags instances (but no other tables) ----

## method for getting all tag instances associated with a specific tweet
@get('/taginstances/tweetID/<tweetID:int>')
def tagInstancesByTweetID(tweetID):
    # TODO: 
    # run the appropriate query
    # turn it into json of the right format
    # return
    # deal with case where tweetID isn't valid/doesn't exist.
    return '{"tag_instances":[]}'

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
@get('/taginstances/clientID/<clientID:int>')
def tagInstancesByClientID(clientID):
    # TODO: 
    # run the appropriate query
    # turn it into json of the right format
    # return
    # deal with case where clientID isn't valid/doesn't exist.
    return '{"tag_instances":[]}'


# ---- Interactions with tags instances and tags (but no other tables) ----

## method for getting all tags instances with a certain tag
@get('/taginstances/tagID/<tagID:int>')
def tagInstancesByTagID(tagID):
    # TODO: 
    # run the appropriate query
    # turn it into json of the right format
    # return
    # deal with case where tagID isn't valid/doesn't exist.
    return '{"tag_instances":[]}'

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
