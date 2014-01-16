from pymongo import MongoClient
import pymongo
import datetime
import time
import dateutil.parser as dparser
import bson

HISTORICAL_DB_NAME = 'newdb'  # 'crisisdb'
LIVE_DB_NAME = 'current_database'
TIME_MULTIPLIER = 1
SLEEP_SECONDS = 5

# Twitter API-specific field names
CREATED_AT = 'created_at'
UNIQUE_ID = 'uuid'

############## TODO: Tridiv
# Our created_at datetime object field name 
OUR_CREATED_AT = 'helloworld'

# connect to two databases
# be sure to run mongod in the terminal before starting
dbclient = MongoClient('localhost', 27017)
historicaldb = dbclient[HISTORICAL_DB_NAME] 
currentdb = dbclient[LIVE_DB_NAME]


############## TODO: Tridiv - deal with datetime crap
# look through all entries in historicaldb for time, turn them into datetime, store in "OUR_CREATED_AT" field
# change all future CREATED_AT lookups to look into OUR_CREATED_AT
##############

# record current time
previousTime = datetime.datetime.now()

# get time of first tweet in historicaldb 
# relies on the field for time being called 'createdAt' 
# relies on us having changed all times in the db to be datetime objects
# see ipython notebook for how to update these to datetime objects
# explain next loc
first_tweet = historicaldb.tweets.find().sort(UNIQUE_ID, pymongo.ASCENDING).limit(1)[0]
print 'HELLLLLO'
#print bson.loa(first_tweet)
print first_tweet
# TODO real twitter api uses created_at and might have other datetime issues to deal with
starting_time = first_tweet[CREATED_AT]
historicalTime = starting_time

# infinite loop
# there may/is probably a better/safer way to have an infinite loop running 
# (ex. a way that will restart if something goes wrong)
while True: 
    # get time now
    timeNow = datetime.datetime.now()
    print timeNow

    # how long has it been since previousTime?
    delta = timeNow - previousTime
    # print 'delta: ' + str(delta)

    # replace previousTime with timeNow
    previousTime = timeNow

    # run DB query to get all tweets within delta of historicalTime, going forward
    new_tweets = historicaldb.tweets.find({CREATED_AT: {"$gte": historicalTime, "$lt": historicalTime+(delta * TIME_MULTIPLIER)}})
    
    # update historicalTime
    historicalTime += (delta * TIME_MULTIPLIER)
    # print historicalTime 

    # print 'tweets: ' + str(new_tweets)
    # for item in new_tweets:
    #     print item

    # add t to currentdb
    for tweet in new_tweets: 
        currentdb.tweets.insert(tweet)
        # print currentdb.tweets.find()

    # optional - sleep for a few seconds
    time.sleep(SLEEP_SECONDS)
    
