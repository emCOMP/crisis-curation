from pymongo import MongoClient
import pymongo
import datetime
import time
import dateutil.parser as dparser
import pytz

import sys
import tweepy
import webbrowser
import json 
import time


### get change-able info from config file! 
### __________________________________________________________ ### 
import config
system_configs = config.read_system_configs()

LIVE_DB_NAME = system_configs['current_database']

if system_configs['historical_or_live'] != 'live':
    raise Exception('this system uses historical not live data')

live_configs = config.read_live_configs()

## twitter authentication details
CONSUMER_KEY = live_configs['consumer_key']
CONSUMER_SECRET = live_configs['consumer_secret']
ACCESS_TOKEN = live_configs['access_token_key']
ACCESS_TOKEN_SECRET = live_configs['access_token_secret'] 
auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
auth.set_access_token(ACCESS_TOKEN, ACCESS_TOKEN_SECRET)

## keywords
a = live_configs['keywords']
Q = json.loads(live_configs['keywords'])

### __________________________________________________________ ### 

# connect to database
# be sure to run mongod in the terminal before starting
dbclient = MongoClient('localhost', 27017)
currentdb = dbclient[LIVE_DB_NAME]

## for converting datetime to unix epoch
UNIX_EPOCH = datetime.datetime(1970, 1, 1, 0, 0, tzinfo = pytz.utc)
def EPOCH(utc_datetime):
    delta = utc_datetime - UNIX_EPOCH
    seconds = delta.total_seconds()
    return seconds

class CustomStreamListener(tweepy.StreamListener):

    def on_data(self, raw_json):
        try:
            print "got one" 
            #print raw_json
            tweet = json.loads(raw_json)
            unix_time = EPOCH(dparser.parse(tweet['created_at']))
            tweet['unix_time'] = unix_time
            currentdb.tweets.insert(tweet)

        except Exception, e:
            print >> sys.stderr, 'Encountered Exception:', e
            pass

    def on_error(self, status_code):
        print >> sys.stderr, 'Encountered error with status code:', status_code
        return True # Don't kill the stream

    def on_timeout(self):
        print >> sys.stderr, 'Timeout...'
        return True # Don't kill the stream

# Create a streaming API and set a timeout value of 600 seconds.    

streaming_api = tweepy.streaming.Stream(auth, CustomStreamListener(), timeout=600)
print >> sys.stderr, 'Filtering the public timeline for "%s"' % (' '.join(Q),)
streaming_api.filter(follow=None, track=Q)
