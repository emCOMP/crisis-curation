from pymongo import MongoClient
import pymongo
import datetime
import time
import dateutil.parser as dparser

# connect to two databases
# be sure to run mongod in the terminal before starting
dbclient = MongoClient('localhost', 27017)
historicaldb = dbclient.crisisdb
currentdb = dbclient.current_database


# record current time, CurrentTime
previousTime = datetime.datetime.now()

# get time of first tweet in historical db HistoricalTime
first_tweet = historicaldb.tweets.find().sort("id", pymongo.ASCENDING).limit(1)[0]
starting_time = first_tweet['createdAt']
historicalTime = starting_time

# infinite loop
while True: 
    # get time now, TimeNow
    timeNow = datetime.datetime.now()
    print timeNow

    # how long has it been since CurrentTime?
    delta = timeNow - previousTime
    print 'delta: ' + str(delta)

    # replace CurrentTime with TimeNow
    previousTime = timeNow

    # run DB query to get all tweets T within delta of historicalTime
    T = historicaldb.tweets.find({'createdAt': {"$gte": historicalTime, "$lt": historicalTime+delta}})
    
    # update historicalTime
    historicalTime += delta
    print historicalTime 

    print 'tweets: ' + str(T)
    for item in T:
        print item

    # add T to currentdb
    for tweet in T: 
        currentdb.tweets.insert(tweet)

    # replace HistoricalTime with HistoricalTime + S
    historicalTime += delta

    # optional - sleep for a few seconds
    time.sleep(5)
    
