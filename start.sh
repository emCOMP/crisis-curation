#! /bin/bash

COLOR='\e[0;32m'
NC='\e[0m'

source yourDirectories.sh

###### CHECK/EXECUTE MONGOD
echo -e "${COLOR}Checking for running instance of Mongo DB server.${NC}"
mongod_running=`pgrep -f mongod | wc -l`
if [[ $mongod_running == 0 ]]
then  	echo -e "${COLOR}Mongo DB server is not running${NC}"
	echo -e "${COLOR}Starting Mongo DB server${NC}"
	sudo ${folder_mongo_root}/bin/mongod --fork --logpath ${folder_mongo_root}/server.log
else	echo -e "${COLOR}Running instance of Mongo DB server detected.${NC}"
	echo -e "${COLOR}Proceeding with execution...${NC}"
fi


##### DROP CURRENT_DATABASE IN MONGO DB
echo -e "${COLOR}Inspecting Database for \"Current Database\" collection${NC}"
mongo << EOF
use current_database
db.dropDatabase()
exit
EOF

echo -e "${COLOR}Current Database wiped for new execution.${NC}"


##### STARTING crisisServer.py
echo -e "${COLOR}Checking for running instance of crisisSever${NC}"
crisisServer_running=`pgrep -f crisisServer.py | wc -l`
if [[ $crisisServer_running == 0 ]]
then  	echo -e "${COLOR}crisisServer is not running${NC}"
	echo -e "${COLOR}Starting crisisServer${NC}"
else	echo -e "${COLOR}Running instance of crisisServer detected.${NC}"
	echo -e "${COLOR}Killing existing instance and rerunning server${NC}"
	pgrep -f crisisServer.py | xargs kill
fi
nohup python ${folder_crisisServer_root}/crisisServer.py &
sleep 1
echo -e "${COLOR}CrisisServer initiated.${NC}"

##### STARTING historicalTweets.py
echo -e "${COLOR}Checking for running instance of historicalTweets.py${NC}"
historicalTweets_running=`pgrep -f historicalTweets.py | wc -l`
if [[ $historicalTweets_running == 0 ]]
then  	echo -e "${COLOR}historicalTweets.py is not running${NC}"
	echo -e "${COLOR}Starting historical Tweets pull${NC}"
else	echo -e "${COLOR}Running instance of historicalTweets.py detected.${NC}"
	echo -e "${COLOR}Killing existing instance and re-executing${NC}"
	pgrep -f historicalTweets.py | xargs kill
fi
nohup python ${folder_crisisServer_root}/historicalTweets.py &
sleep 1
echo -e "${COLOR}Historical Tweets are now being pulled.${NC}"
