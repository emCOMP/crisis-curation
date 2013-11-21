from bottle import run, get, post, request
from pymongo import MongoClient
import json

# ---- For clients to send tags to the server ----

tags = []

@get('/newtag')
def newTag_form():
    return '''
    <form action="/newtag" method="post">
      Tag Text: <input name="tag text" type="text" />
      Color: <input name="color" type="text" />
      Tag ID: <input name="tag id" type="int" />
      <input value="Add tag" type="submit" />
    </form>
    '''

@post('/newtag')
def newTag():
    tag_text = request.forms.get("tag text")
    tag_color = request.forms.get("color")
    tagID = request.forms.get("tag id")
    tags.append({'tag_text':tag_text, 'color':tag_color, 'tag_id':tagID})
    


# ---- For clients to send tag instances to the server ----

tagInstances = []

@get('/newtaginstance')
def newTagInstance_form():
    return '''
    <form action="/newtaginstance" method="post">
      Tag ID: <input name="tag id" type="int" />
      Tweet ID: <input name="tweet id" type="int" />
      Instance ID: <input name="instance id" type="int" />
      <input value="Add tag instance" type="submit />
    </form>
    '''

@post('/newtaginstance')
def newTagInstance():
    tag_id = request.forms.get("tag id")
    tweet_id = request.forms.get("tweet id")
    instance_id = request.forms.get("instance id")
    tagInstances.append({'tag_id':tag_id, 'tweet_id':tweet_id, 'instance_id':instance_id})



# ---- Methods for clients to get Tweets ----

# return the 3 most recent tweets
@get('/tweets')
def tweets():
    tweet =  {
                 "profilePic":"assets/img/profile-pic.JPG",
                 "fullName":"John Doe",
                 "username":"@jdoe",
                 "timeStamp":"39",
                 "tweetText":"North of the Border in Scotland @SEPAView have 4 Flood Alerts & 3 Flood Warnings!! http://floodline.sepa.org.uk/floodupdates/ #FloodAware #ThinkDontSink",
                 "reTweets":"63",
                 "favorites":"3"
              }
    jsonObj = {"items": [
             tweet, tweet, tweet, tweet, tweet
           ]
        };
    return json.dumps(jsonObj)

@get('/tweets/<num:int>')
def tweets(num):
    return str(num) + ' tweets'

@get('/tweets/since/<tweetID:int>')
def tweetsSince(tweetID):
    return 'tweets since ' + str(tweetID)

@get('/tweets/before/<tweetID:int>')
def tweetsBefore(tweetID):
    return '20 tweets before ' + str(tweetID)


# ---- Methods for clients to get Tags ----

@get('/tags')
def tags():
    return 'all tags'



# ---- Methods for clients to get Tag Instances ----

@get('/taginstances')
def tagInstances():
    return 'all tag instances'

@get('/taginstances/since/<tagInstanceID:int>')
def tagInstancesSince(tagInstanceID):
    return 'tag instances since ' + str(tagInstanceID)


# ---- Opening the Database ----

dbclient =  MongoClient('localhost', 27017)

#db = dbclient.test_database


# ---- Starting the Server ----

run(host='localhost', port=8080, debug=True)
