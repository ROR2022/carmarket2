import React from 'react'

const VideoPage = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <video 
        src="/carmarketvideo1.mkv" 
        autoPlay 
        loop 
        controls
        playsInline
        aria-label="Video promocional de Car Market"
        className="w-full rounded-lg shadow-lg"
      >
        <track
          kind="captions"
          src="/subtitles/carmarketvideo1.vtt"
          srcLang="es"
          label="Español"
          default
        />
        Tu navegador no soporta el elemento de video.
      </video>
    </div>
  )
}

export default VideoPage