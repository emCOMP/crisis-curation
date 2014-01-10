# run the script and then point your browser to localhost: http://localhost:8080/

from bottle import run, get, post, request
from pymongo import MongoClient
import pymongo
import json
from bson import Binary, Code
from bson.json_util import dumps

# ---- For clients to send tags to the server ----

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
    generated_id = tags.insert(tag_document)
    return generated_id


# ---- For clients to send tag instances to the server ----

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


# ---- Methods for clients to get Tweets ----

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


# ---- Methods for clients to get Tags ----

@get('/tags')
def tags():
    all_tags = tags.find()
    ret = ''
    for t in all_tags: 
        ret += str(t)
    return ret


# ---- Methods for clients to get Tag Instances ----

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
