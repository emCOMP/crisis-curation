from pymongo import MongoClient
import pymongo
import datetime
import time
import dateutil.parser as dparser
import pytz

HISTORICAL_DB_NAME = 'football'
LIVE_DB_NAME = 'current_database'
TIME_MULTIPLIER = 1
SLEEP_SECONDS = 5


# connect to two databases
# be sure to run mongod in the terminal before starting
dbclient = MongoClient('localhost', 27017)
historicaldb = dbclient[HISTORICAL_DB_NAME] 
currentdb = dbclient[LIVE_DB_NAME]

## for converting datetime to unix epoch
UNIX_EPOCH = datetime.datetime(1970, 1, 1, 0, 0, tzinfo = pytz.utc)
def EPOCH(utc_datetime):
    delta = utc_datetime - UNIX_EPOCH
    seconds = delta.total_seconds()
    ms = seconds * 1000
    return int(ms)

## IF any entry in historicaldb doesn't have unix time:
##   add it. 
print 'adding unix times - might take a bit'
no_unix = historicaldb.tweets.find( { 'unix_time' : {'$exists': False} } )
for tweet in no_unix:
    unix_time = EPOCH(dparser.parse(tweet['created_at']))
    historicaldb.tweets.update({"_id" : tweet['_id']}, {'$set': {'unix_time': unix_time}})


# record current time
previousTime = datetime.datetime.now()

# get time of first tweet in historicaldb 
# relies on the field for time being called 'createdAt' 
# relies on us having changed all times in the db to be datetime objects
# see ipython notebook for how to update these to datetime objects
# explain next loc
first_tweet = historicaldb.tweets.find().sort("id", pymongo.ASCENDING).limit(1)[0]
starting_time = first_tweet['unix_time']
historicalTime = starting_time

# infinite loop
# there may/is probably a better/safer way to have an infinite loop running 
# (ex. a way that will restart if something goes wrong)
while True: 
    # get time now
    timeNow = datetime.datetime.now()
    print timeNow

    # how long has it been since previousTime?
    delta = (timeNow - previousTime).total_seconds()
    # print 'delta: ' + str(delta)

    # replace previousTime with timeNow
    previousTime = timeNow

    # run DB query to get all tweets within delta of historicalTime, going forward
    new_tweets = historicaldb.tweets.find({'unix_time': {"$gte": historicalTime, "$lt": historicalTime+(delta * TIME_MULTIPLIER)}})
    
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
    
