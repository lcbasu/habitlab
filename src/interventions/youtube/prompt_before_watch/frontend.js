window.Polymer = window.Polymer || {}
window.Polymer.dom = 'shadow'

console.log('youtube/prompt_before_watch')

const $ = require('jquery')

const {close_selected_tab} = require('libs_frontend/tab_utils')

const {
  once_available,
  run_only_one_at_a_time,
  on_url_change,
  wrap_in_shadow,
} = require('libs_frontend/common_libs')

const {
  get_seconds_spent_on_current_domain_today,
  get_seconds_spent_on_domain_today,
} = require('libs_common/time_spent_utils')

const {
  log_action,
} = require('libs_frontend/intervention_log_utils')

require('enable-webcomponents-in-content-scripts')
require('components/habitlab-logo.deps')
require('components/close-tab-button.deps')
require('bower_components/paper-button/paper-button.deps')

//console.log('youtube prompt before watch loaded frontend')


let end_pauser = null //new
let play_video_clicked = false
let video_pauser = null

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
  }, 250);
}

//Initially pauses the video when the page is loaded
function pauseVideo() {
	const overlayBox = document.querySelector('video:not(#rewardvideo)');
	if (!overlayBox.paused) {
		overlayBox.pause();
	}
}

var overlay_div = $()

function set_overlay_position_over_video() {
  if (overlay_div.length == 0) {
    return
  }
  var video = $('video:not(#rewardvideo)')
  var video_container = video
  //while (video_container.length > 0) {}
  const $a = overlay_div
  $a.width(video.width());
	$a.height(video.height());
	$a.css({'background-color': 'white'});
	$a.css('z-index', 30);
  const b = overlay_div[0]
	b.style.left = video.offset().left + 'px';
	b.style.top = video.offset().top + 'px';
	b.style.opacity = 0.9;
}

//Places a white box over the video with a warning message
function divOverVideo(status) {
	//Constructs white overlay box
  var video = $('video:not(#rewardvideo)')
  if (video.length == 0) {
    return
  }
  if (window.location.href.indexOf('watch') == -1) {
    return
  }
  if ($('#habitlab_video_overlay').data('location') == window.location.href) {
    return
  }
  const $a = $('<div>').css({'position': 'absolute', 'display': 'table'});
  overlay_div = $a
	$a.text();
  set_overlay_position_over_video()
	$(document.body).append($(wrap_in_shadow($a)).data('location', window.location.href).attr('id', 'habitlab_video_overlay'));

	//Centered container for text in the white box
	const $contentContainer = $('<div>')
  .addClass('contentContainer')
  .css({
    //'position': 'absolute',
    //'top': '50%',
    //'left': '50%',
    //'transform': 'translateX(-50%) translateY(-50%)',
    'text-align': 'center',
    'display': 'table-cell',
    'vertical-align': 'middle'
  });
  
  $contentContainer.append('<habitlab-logo>')
  $contentContainer.append('<br><br>')

	//Message to user
	const $text1 = $('<h2>');
	if (status === 'begin') {
    var wait_for_video_duration = null;
    var set_video_duration = function() {
      var video = $('video:not(#rewardvideo)');
      if (video.length == 0) return;
      const duration = Math.round(video[0].duration)
      if (!isNaN(duration)) {
        const minutes = Math.floor(duration / 60)
        const seconds = (duration % 60)
        $text1.html("This video is " + minutes + " minutes and " + seconds + " seconds long. <br>Are you sure you want to play it?");
        clearInterval(wait_for_video_duration);
        return true
      }
      return false
    }
    if (!set_video_duration()) {
      wait_for_video_duration = setInterval(set_video_duration, 100)
    }
	} else { //status === 'end'
      get_seconds_spent_on_domain_today('www.youtube.com', function(secondsSpent) {
          const mins = Math.floor(secondsSpent/60)
          const secs = secondsSpent % 60
          $text1.html("You've spent " + mins + " minutes and " + secs + " seconds on Youtube today. <br>Are you sure you want to continue watching videos?");
      })
	}
	$contentContainer.append($text1);
	$contentContainer.append($('<br>'));

	//Close tab button
	const $button1 = $('<close-tab-button text="Close Youtube">');
	$contentContainer.append($button1);

	//Continue watching video button
	const $button2 = $('<paper-button>');
	$button2.text("Watch Video");
	$button2.css({
    'cursor': 'pointer',
    'background-color': '#415D67',
    'color': 'white',
    '-webkit-font-smoothing': 'antialiased',
    'box-shadow': '2px 2px 2px #888888',
    'height': '38px',
    'margin-left': '10px'
  });
	$button2.click(() => {
    log_action({'negative': 'remainedOnYoutube'})
		removeDivAndPlay();
		$button2.hide();
	})
	$contentContainer.append($button2);

	//Adds text into the white box
	$a.append($contentContainer);

  //Logs impression
}

//Remove the white div
function removeDivAndPlay() {
  play_video_clicked = true;
	$('#habitlab_video_overlay').remove();
	const play = document.querySelector('video:not(#rewardvideo)');
	play.play();
}

//Remove the white div
function removeDiv() {
  $('#habitlab_video_overlay').remove();
}

function endWarning() {
  // $('video').on('ended', function() {
  // 	console.log("executing");
  // 	divOverVideoEnd();
  // });
	const overlayBox = document.querySelector('video:not(#rewardvideo)');
	if ((overlayBox.currentTime > (overlayBox.duration - 0.15)) && !overlayBox.paused) {
    clearInterval(end_pauser)
    pauseVideo()
		divOverVideo("end")
	}
}

//All method calls
function main() {
  create_video_pauser()
  removeDiv();
	divOverVideo("begin");
  end_pauser = setInterval(() => {
    endWarning()
  }, 150); //Loop to test the status of the video until near the end
}

//Link to Fix: http://stackoverflow.com/questions/18397962/chrome-extension-is-not-loading-on-browser-navigation-at-youtube
function afterNavigate() {
  if ('/watch' === location.pathname) {
    //if (video_pauser) {
    //  clearInterval(video_pauser);
    //  video_pauser = null;
    //}
    //$(document).ready(main);
    main();
  } else {
    removeDiv();
  }
}

//Youtube specific call for displaying the white div/message when the red top slider transitions
//(Solution from link above)
(document.body || document.documentElement).addEventListener('transitionend',
  (event) => {
    if (event.propertyName === 'width' && event.target.id === 'progress') {
        afterNavigate();
    }
}, true);

//$(document).ready(main);
//main()

once_available('video:not(#rewardvideo)', () => {
  afterNavigate()
})

//Executed after page load
afterNavigate();

window.addEventListener('popstate', function(evt) {
  afterNavigate()
})

window.on_intervention_disabled = () => {
  removeDivAndPlay()
}

window.debugeval = x => eval(x);