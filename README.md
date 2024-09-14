## fixes
* Add more data in upsinverter text
* Store logs and more info in mongoDB
* Store request limits etc. constants in other file

## safety
* cors on nextjs apis
* api key for mapbox and others visible in developer tools, network tab

## stats
* takes less than 30 seconds

## Documentation
### Factory
* FetcherFactory - This is responsible for scraping required html data of the websites.
* ParserFactory - It reads through all the fetched html data, analyses it and returns the required/generated content.