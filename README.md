# Itch.io Ajolote Bot

## Purpose

Ajolote Bot was created to encourage Discord contestants of hackathons like ours ([Up! Steam3](http://upsteam.es "Up! Steam3")) to vote for as many projects as possible during the voting phase.

Every time the bot is invoked, it will retrieve the whole list of hackathon entries and it will publish a random one from the bottom less voted projects.

## Instalation

1. Create a file `.env` in root directory to host Discord Bot Token and the Itch.io Jam ID

        TOKEN=aabbccddeeff11233445566aabbccddeerr
        JAM_ID=1234567
		INTERVAL=5
		WINNERS=1563751,1523732,1533047,1548543,1557131,1547724,1547943,1555263,1547138
    
2. Download node packages

	`npm install`
	
4. Go and kick up bot

	`node index.js`

## Usage

Any user can invoke the bot running any of these commands.

	/karma (10% less voted projects)
	/random (completely random)
	/top (top 10% voted projects)
	/cool (top 10% coolest projects)
	/winner (random from WINNERS env variable)
