# uploadVideoInChunks
This class help to upload video in chunks to graph api facebook


## How to use? 

### Import class only and set parameters 
const videoHandler = new VideoHandler({ file: file, facebookToken: facebookToken, account_id: account_id })        
### Execute main startUpload method 
let result = await videoHandler.startUpload()

### startUpload returns 
Video id: result.id
Video thumbnails: result.thumbnails 
