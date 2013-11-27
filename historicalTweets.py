from pymongo import MongoClient
import pymongo
import datetime
import time
import dateutil.parser as dparser

# connect to two databases
# be sure to run mongod in the terminal before starting
dbclient = MongoClient('localhost', 27017)
historicaldb = dbclient.crisisdb #TODO: change this to take string so that we can pass in string for db name 
#TODO: livedb (change name also possibly pass in name for this?) 
currentdb = dbclient.current_database

# record current time
previousTime = datetime.datetime.now()

# get time of first tweet in historicaldb 
# relies on the field for time being called 'createdAt' 
# relies on us having changed all times in the db to be datetime objects
# see ipython notebook for how to update these to datetime objects
# explain next loc
first_tweet = historicaldb.tweets.find().sort("id", pymongo.ASCENDING).limit(1)[0]
starting_time = first_tweet['createdAt']
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
    print 'delta: ' + str(delta)

    # replace previousTime with timeNow
    previousTime = timeNow

    # run DB query to get all tweets within delta of historicalTime, going forward
    new_tweets = historicaldb.tweets.find({'createdAt': {"$gte": historicalTime, "$lt": historicalTime+delta}})
    
    # update historicalTime
    historicalTime += delta
    print historicalTime 

    print 'tweets: ' + str(new_tweets)
    for item in new_tweets:
        print item

    # add t to currentdb
    for tweet in new_tweets: 
        currentdb.tweets.insert(tweet)

    # replace HistoricalTime with HistoricalTime + S
    historicalTime += delta

    # optional - sleep for a few seconds
    time.sleep(5) # TODO: make the 5 into a variable
    
