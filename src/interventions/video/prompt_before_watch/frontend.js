window.Polymer = window.Polymer || {}
window.Polymer.dom = 'shadow'

if (typeof(window.wrap) != 'function')
  window.wrap = null

var $ = require('jquery');

var {
  once_available
} = require('libs_frontend/common_libs')

require('enable-webcomponents-in-content-scripts')
require('components/habitlab-logo.deps')
require('components/close-tab-button.deps')
require('components/video-overlay.deps')
require('bower_components/paper-button/paper-button.deps')

function pause_video() {
  console.log('pause_video called')
  var video = document.querySelector('video')
  video.pause()
  //if (!video.paused) {
  //  document.querySelector('.btn-pause').click()
  //}
}

function resume_video() {
  console.log('resume_video called')
  var video = document.querySelector('video')
  video.play()
  //if (video.paused) {
  //  document.querySelector('.btn-play').click()
  //}
}

function remove_overlay_and_resume_video() {
  $('video-overlay').remove()
  resume_video()
}

function set_overlay_position_over_video() {
  console.log('resizing overlay position over video')
  var video = $('video')
  var overlay = $('video-overlay')
  overlay.css({
    position: 'absolute',
    width: video.width()+'px',
    height:video.height()+'px',
    top: video.offset().top+'px',
    left:video.offset().left+'px',
    'z-index': 999999999999999
  })
}

function pause_video_and_add_overlay() {
  pause_video()
  console.log('adding overlay')
  var overlay = $('<video-overlay>')
  overlay.on('watch_clicked', function() {
    console.log('watch_clicked on outside')
    remove_overlay_and_resume_video()
  })
  /*
  get_seconds_spent_on_domain_today('www.iqiyi.com').then(function(secondsSpent) {
    const mins = Math.floor(secondsSpent/60)
    const secs = secondsSpent % 60
    console.log('getting time spent')
    $($('video-overlay')[0].$$('#msg')).html("You've spent " + mins + " minutes and " + secs + " seconds on Iqiyi today. <br>Are you sure you want to continue watching videos?")
  })
  */
  $('body').append(overlay)
  set_overlay_position_over_video()
}

once_available('video', function() {
  console.log('video tag is now available')

    console.log('pause button is now available')
    pause_video_and_add_overlay()

})

/*
var video_pauser = null;
var play_video_clicked = false;

function create_video_pauser() {
  if (video_pauser != null) {
    return
  }
  play_video_clicked = false
  video_pauser = setInterval(() => {
    if (play_video_clicked) {
      clearInterval(video_pauser);
      video_pauser = null
      return;
    }
    pauseVideo();
  }, 100);
}

function pauseVideo() {
  setInterval(function() {
    $('.btn-pause').click()
  }, 1000)
}

function resumeVideo() {
  for (let x of $('object[type="application/x-shockwave-flash"]')) {
    x.style.display = '';
  }
  $('.habitlab_overlay').remove();
}

pauseVideo();
create_video_pauser();

window.on_intervention_disabled = () => {
  play_video_clicked = true;
  resumeVideo();
}
*/

let prev_video_width = 0
let prev_video_height = 0

function once_video_has_different_height(callback) {
  let video = $('video')
  let video_width = video.width()
  let video_height = video.height()
  if (prev_video_height === video_height && prev_video_width === video_width) {
    setTimeout(function() {
      once_video_has_different_height(callback)
    }, 100)
  } else {
    prev_video_width = video_width
    prev_video_height = video_height
    callback()
  }
}

window.addEventListener('resize', function(evt){
  // once_video_has_different_height(set_overlay_position_over_video)
  once_video_has_different_height(function() {
   set_overlay_position_over_video()
  })
})
window.debugeval = x => eval(x);