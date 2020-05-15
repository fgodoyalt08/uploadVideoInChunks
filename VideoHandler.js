class VideoHandler {

  constructor(data) {
    this.file = data.file
    this.facebookToken = data.facebookToken
    this.account_id = data.account_id
    this.status = 'starting'
    this.upload_session_id = false
    this.videoId = false
  }

  callModel(formData, url = `https://graph-video.facebook.com/v7.0/${this.account_id}/advideos`) {
    formData.append('access_token', this.facebookToken)
    return fetch(url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.facebookToken}`,
          'Content-Length': this.file.size
        },
        body: formData,
      })
  }

  async startSession() {
    try {

      const formData = new FormData()
      formData.append('file_size', this.file.size)
      formData.append('upload_phase', 'start')

      const sessionData = await this.callModel(formData).then(res => res.json())

      this.upload_session_id = sessionData.upload_session_id
      this.videoId = sessionData.video_id

      await this.sendChunk(sessionData)
    } catch (error) {
      throw new Error(error.message)
    }
  }

  async sendChunk(data) {
    try {

      const formData = new FormData()
      formData.append('start_offset', data.start_offset)
      formData.append('end_offset', data.end_offset)
      formData.append('upload_session_id', this.upload_session_id)
      formData.append('upload_phase', 'transfer')
      formData.append('video_file_chunk', this.file.slice(data.start_offset, data.end_offset))

      const chunkResult = await this.callModel(formData).then(res => res.json())

      if (chunkResult.end_offset === chunkResult.start_offset) {
        await this.finishSession()
      } else {
        await this.sendChunk(chunkResult)
      }

    } catch (error) {
      throw new Error(error.message)
    }
  }

  async finishSession() {
    try {
      const formData = new FormData()
      formData.append('upload_session_id', this.upload_session_id)
      formData.append('upload_phase', 'finish')

      const sessionResult = await this.callModel(formData).then(res => res.json())

      if (sessionResult.success) {
        this.status = 'uploaded'
      } else {
        throw new Error(sessionResult.message)
      }
    } catch (error) {
      throw new Error(error.message)
    }
  }

  async getVideoData() {
    try {
      return this.callModel(new FormData(), `https://graph-video.facebook.com/v7.0/${this.videoId}?fields=id,status,thumbnails`).then(res => res.json())
    } catch (error) {
      throw new Error(error.message)
    }
  }

  async startUpload() {
    await this.startSession()
    let videoHandlerData = { status: { video_status: false } }
    do {
      videoHandlerData = await this.getVideoData()
      if (videoHandlerData.status.video_status === 'ready') {
        return videoHandlerData
      }
    } while (videoHandlerData && videoHandlerData.status.video_status !== 'ready')
  }
}

export default VideoHandler;