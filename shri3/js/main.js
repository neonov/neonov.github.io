var PRESETS, Player, contextClass, playerElement, raf, tabs;

contextClass = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;

if (!contextClass) {
  console.log('Web Audio API is not available');
}

raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
  return window.setTimeout(callback, 1000 / 60);
};

PRESETS = {
  normal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  pop: [1.3, 2.9, 4.4, 4.8, 3.2, -1, -1.7, -1.7, -1.3, -1.3],
  rock: [4.8, 2.9, -3.6, -5.1, -2.5, 2.5, 5.5, 6.7, 6.7, 6.7],
  jazz: [3, 1.6, 0.8, -1.5, -1.5, 0.5, 2.5, 3.1, 3.5, 4.1],
  classic: [0, 0, 0, 0, 0, 0, -4.8, -4.8, -4.8, -6.3]
};

Player = (function() {
  function Player(element) {
    this.audioCtx = new contextClass();
    this.canvas = element.querySelector('.canvas');
    this.drawCtx = this.canvas.getContext('2d');
    this.file = null;
    this.source = null;
    this.playing = false;
    this.buffer = null;
    this.dragging = false;
    this.offset = 0;
    this.draggingVolume = false;
    this.vol = 1;
    this.eq = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.typeVizualization = 'spectrum';
    this.$element = element;
    this.$addIcon = element.querySelector('.add > .icon');
    this.$upload = element.querySelector('#audio_file');
    this.$playPause = element.querySelector('.play-pause');
    this.$playPauseIcon = element.querySelector('.play-pause .icon');
    this.$timer = element.querySelector('.timer');
    this.$audioDuration = element.querySelector('.audio-duration');
    this.$progress = element.querySelector('.track__progress');
    this.$track = element.querySelector('.track');
    this.$audioName = element.querySelector('.name');
    this.$trackVolume = element.querySelector('.volume__track');
    this.$volumeCtrl = element.querySelector('.volume__ctrl');
    this.$volumeProgress = element.querySelector('.volume__progress');
    this.$volumeIcon = element.querySelector('.volume__btn > .icon');
    this.$volumeBtn = element.querySelector('.volume__btn');
    this.$volume = element.querySelector('.volume');
    this.$settings = element.querySelector('.settings');
    this.$settingsCtrl = element.querySelector('.settings__ctrl');
    this.$settingsBtn = element.querySelector('.settings__btn');
    this.$eqPresetsLinks = element.querySelectorAll('.equalizer__presets-item a');
    this.$eqInputs = element.querySelectorAll('.equalizer input[type="range"]');
    this.$vizItems = element.querySelectorAll('.vizualization__item');
    this.$dropZone = document.querySelector('.dropZone');
    this.$alert = document.querySelector('.alert');
    this.maxFileSize = 10000000;
    this.canvasHeight = this.canvas.height = 50;
    this.canvasWidth = this.canvas.width = this.$element.offsetWidth;
    this.waitUpload();
    this.bindMouseEvents();
    this.bindDropEvents();
    this.bindEqEvents();
    this.bindVizEvents();
    this.drawAll();
  }

  Player.prototype.waitUpload = function() {
    var self;
    self = this;
    return this.$upload.onchange = function() {
      var files;
      files = this.files;
      if (files.length > 0) {
        self.file = URL.createObjectURL(files[0]);
        self.request(self.file);
        self.nameFile = files[0].name;
        if (self.playing) {
          self.playing = false;
          return self.source.stop(0);
        }
      }
    };
  };

  Player.prototype.bindMouseEvents = function() {
    this.$playPause.addEventListener('click', this.togglePlay.bind(this));
    this.$track.addEventListener('mousedown', this.onDown.bind(this));
    window.addEventListener('mousemove', this.onMove.bind(this));
    window.addEventListener('mouseup', this.onUp.bind(this));
    this.$trackVolume.addEventListener('mousedown', this.onDownVolume.bind(this));
    this.$volumeBtn.addEventListener('click', this.toggleVolumeOff.bind(this));
    return this.$settingsBtn.addEventListener('click', this.changeSettings.bind(this));
  };

  Player.prototype.changeSettings = function() {
    if (!classie.has(this.$settings, 'active')) {
      this.$settingsCtrl.style.height = 'auto';
      this.$settingsCtrl.style.top = '50px';
      this.$settingsCtrl.style.visibility = 'visible';
      this.$settingsCtrl.style.opacity = '1';
      return classie.add(this.$settings, 'active');
    } else {
      this.$settingsCtrl.style.top = '100px';
      this.$settingsCtrl.style.visibility = 'none';
      this.$settingsCtrl.style.opacity = '0';
      this.$settingsCtrl.style.height = '0';
      return classie.remove(this.$settings, 'active');
    }
  };

  Player.prototype.request = function(file) {
    var xhr;
    xhr = new XMLHttpRequest();
    xhr.open('GET', file, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
    xhr.onload = (function(_this) {
      return function() {
        return _this.decode(xhr.response);
      };
    })(this);
    this.loading = true;
    return this.toggleAddIcon();
  };

  Player.prototype.toggleAddIcon = function() {
    if (this.loading) {
      classie.add(this.$addIcon, 'icon-folder-open');
      classie.add(this.$addIcon, 'icon-spinner');
      classie.add(this.$addIcon, 'icon-spin');
      return this.$audioName.innerHTML = 'декодирую';
    } else {
      classie.remove(this.$addIcon, 'icon-spinner');
      classie.remove(this.$addIcon, 'icon-spin');
      return classie.add(this.$addIcon, 'icon-folder-open');
    }
  };

  Player.prototype.decode = function(arraybuffer) {
    return this.audioCtx.decodeAudioData(arraybuffer, (function(_this) {
      return function(audioBuffer) {
        _this.loading = false;
        _this.offset = 0;
        _this.buffer = audioBuffer;
        _this.makeGraph();
        _this.getAudioData();
        _this.togglePlay();
        _this.toggleAddIcon();
        return _this.addAudioInformation();
      };
    })(this));
  };

  Player.prototype.getAudioData = function() {
    this.duration = this.buffer.duration;
    this.fbc = this.analyser.frequencyBinCount;
    this.freqDomain = new Uint8Array(this.fbc);
    return this.timeDomain = new Uint8Array(this.fbc);
  };

  Player.prototype.addAudioInformation = function() {
    this.$audioDuration.innerHTML = this.timeFormat(this.duration);
    return this.$audioName.innerHTML = this.nameFile;
  };

  Player.prototype.makeGraph = function() {
    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = this.buffer;
    this.analyser = this.audioCtx.createAnalyser();
    this.gainNode = this.audioCtx.createGain();
    this.filters = this.createFilters();
    if (this.vol != null) {
      this.gainNode.gain.value = this.vol;
    }
    if (this.file != null) {
      [].forEach.call(this.$eqInputs, (function(_this) {
        return function(input, i) {
          if (_this.file) {
            return _this.filters[i].gain.value = _this.eq[i];
          }
        };
      })(this));
    }
    this.source.connect(this.filters[0]);
    this.filters[this.filters.length - 1].connect(this.analyser);
    this.analyser.connect(this.gainNode);
    return this.gainNode.connect(this.audioCtx.destination);
  };

  Player.prototype.togglePlay = function() {
    if (this.file) {
      if (!this.playing) {
        this.play();
        classie.add(this.$playPauseIcon, 'icon-pause');
        return classie.remove(this.$playPauseIcon, 'icon-play');
      } else {
        this.pause();
        classie.add(this.$playPauseIcon, 'icon-play');
        return classie.remove(this.$playPauseIcon, 'icon-pause');
      }
    }
  };

  Player.prototype.play = function() {
    this.startTime = this.audioCtx.currentTime - this.offset;
    this.source.start(0, this.offset);
    return this.playing = true;
  };

  Player.prototype.pause = function() {
    if (this.source) {
      this.source.stop(0);
      this.pauseTime = this.audioCtx.currentTime;
      this.offset = this.pauseTime - this.startTime;
      this.source = null;
      this.makeGraph();
      this.playing = false;
      return this.paused = true;
    }
  };

  Player.prototype.onDownVolume = function(e) {
    var topCtrl, topTrack, v;
    this.draggingVolume = true;
    classie.add(this.$volume, 'using');
    topCtrl = this.$volumeCtrl.offsetTop;
    topTrack = this.$trackVolume.offsetTop;
    this.height = this.$trackVolume.offsetHeight;
    v = this.$element.offsetTop;
    this.rangeHeight = v + this.canvasHeight + topCtrl + topTrack;
    return this.updateVolume(e);
  };

  Player.prototype.toggleVolumeOff = function(e) {
    if (this.vol > 0) {
      this.cacheVol = this.vol;
      this.vol = 0;
      this.$volumeProgress.style.height = 0;
      this.toggleVolumeIcon();
      if (this.file) {
        return this.gainNode.gain.value = 0;
      }
    } else {
      this.vol = this.cacheVol;
      this.$volumeProgress.style.height = this.vol * 100 + '%';
      this.toggleVolumeIcon();
      if (this.file) {
        return this.gainNode.gain.value = this.vol;
      }
    }
  };

  Player.prototype.updateVolume = function(e) {
    if (e.pageY <= this.rangeHeight) {
      this.$volumeProgress.style.height = '100%';
      this.vol = 1;
      this.toggleVolumeIcon();
      if (this.gainNode) {
        return this.gainNode.gain.value = this.vol;
      }
    } else if (e.pageY >= this.rangeHeight + this.height) {
      this.vol = 0;
      this.$volumeProgress.style.height = 0;
      this.toggleVolumeIcon();
      if (this.gainNode) {
        return this.gainNode.gain.value = this.vol;
      }
    } else {
      this.vol = (-e.pageY + this.rangeHeight + this.height) / this.height;
      this.$volumeProgress.style.height = this.vol * 100 + '%';
      this.toggleVolumeIcon();
      if (this.gainNode) {
        return this.gainNode.gain.value = this.vol;
      }
    }
  };

  Player.prototype.toggleVolumeIcon = function() {
    var ref, ref1;
    if ((0.4 < (ref = this.vol) && ref <= 1)) {
      classie.add(this.$volumeIcon, 'icon-volume-up');
      classie.remove(this.$volumeIcon, 'icon-volume-down');
      return classie.remove(this.$volumeIcon, 'icon-volume-off');
    } else if ((0.1 < (ref1 = this.vol) && ref1 <= .4)) {
      classie.remove(this.$volumeIcon, 'icon-volume-up');
      classie.remove(this.$volumeIcon, 'icon-volume-off');
      return classie.add(this.$volumeIcon, 'icon-volume-down');
    } else if (this.vol === 0) {
      classie.remove(this.$volumeIcon, 'icon-volume-up');
      classie.remove(this.$volumeIcon, 'icon-volume-down');
      return classie.add(this.$volumeIcon, 'icon-volume-off');
    }
  };

  Player.prototype.onDown = function(e) {
    var playerLeft;
    if (this.file) {
      this.dragging = true;
      playerLeft = this.$element.offsetLeft;
      this.rangeWidth = this.$track.offsetWidth;
      this.rangeLeft = this.$track.offsetLeft + playerLeft;
      this.updateProgress(e);
    }
    if (this.draggingVolume) {
      return this.updateVolume(e);
    }
  };

  Player.prototype.onMove = function(e) {
    if (this.file && this.dragging) {
      this.updateProgress(e);
    }
    if (this.draggingVolume) {
      console.log(this.vol);
      this.toggleVolumeIcon();
      this.updateVolume(e);
      console.log('hi');
    }
    if (this.draggingEqFilter) {
      this.updateFilter(e);
      return this.updateFilterPopup(e);
    }
  };

  Player.prototype.onUp = function(e) {
    if (this.file && this.dragging) {
      this.dragging = false;
      if (this.playing) {
        this.pause();
        this.offset = (e.pageX - this.rangeLeft) / this.rangeWidth * this.duration;
        if (this.offset < 0) {
          this.offset = 0;
        }
        if (this.offset > this.duration) {
          this.offset = this.duration;
        }
        this.play();
      }
    }
    if (this.draggingVolume) {
      classie.remove(this.$volume, 'using');
      this.draggingVolume = false;
      this.vol = (-e.pageY + this.rangeHeight + this.height) / this.height;
      if (this.vol < 0) {
        this.vol = 0;
      }
      if (this.vol > 1) {
        this.vol = 1;
      }
      this.toggleVolumeIcon();
      if (this.gainNode) {
        this.gainNode.gain.value = this.vol;
      }
    }
    if (this.draggingEqFilter) {
      this.draggingEqFilter = false;
      return document.body.removeChild(this.popup);
    }
  };

  Player.prototype.updateProgress = function(e) {
    if (this.dragging) {
      if (e.pageX <= this.rangeLeft) {
        this.offset = 0;
        this.$progress.style.width = 0;
        return this.draggingTimer();
      } else if (e.pageX >= this.rangeLeft + this.rangeWidth) {
        this.offset = this.duration;
        this.$progress.style.width = this.rangeWidth + 'px';
        return this.draggingTimer();
      } else {
        this.$progress.style.width = e.pageX - this.rangeLeft + 'px';
        this.offset = (e.pageX - this.rangeLeft) / this.rangeWidth * this.duration;
        return this.draggingTimer();
      }
    }
  };

  Player.prototype.bindDropEvents = function() {
    this.$alert.ondragover = (function(_this) {
      return function(e) {
        _this.dropping = true;
        _this.onDragOver();
        return false;
      };
    })(this);
    this.$alert.ondragleave = (function(_this) {
      return function(e) {
        _this.dropping = false;
        _this.onDragOver();
        return false;
      };
    })(this);
    this.$alert.ondrop = (function(_this) {
      return function(e) {
        _this.dropping = false;
        _this.onDrop(e);
        return false;
      };
    })(this);
    this.$dropZone.ondrop = (function(_this) {
      return function(e) {
        console.log('hiasasa');
        _this.dropping = false;
        _this.onDrop(e);
        return false;
      };
    })(this);
    return this.$dropZone.ondragover = (function(_this) {
      return function(e) {
        _this.dropping = true;
        _this.onDragOver();
        return false;
      };
    })(this);
  };

  Player.prototype.onDrop = function(event) {
    var file;
    event.preventDefault();
    classie.remove(this.$dropZone, 'hover');
    this.$alert.style.display = 'none';
    file = event.dataTransfer.files[0];
    this.file = URL.createObjectURL(file);
    this.request(this.file);
    this.nameFile = file.name;
    if (this.playing) {
      this.playing = false;
      return this.source.stop(0);
    }
  };

  Player.prototype.onDragOver = function() {
    this.$alert.style.display = 'flex';
    if (!this.dropping) {
      console.log('hi');
      classie.remove(this.$dropZone, 'hover');
      this.$alert.style.display = 'none';
      return this.dropping = false;
    }
  };

  Player.prototype.drawAll = function() {
    if (this.playing) {
      if (this.typeVizualization === 'spectrum') {
        this.drawSpectrum();
      } else if (this.typeVizualization === 'time') {
        this.drawTimeVizualization();
      }
    }
    if (this.playing && !this.dragging) {
      this.indicate = this.audioCtx.currentTime - this.startTime;
      this.drawProgress();
      this.drawTimer();
    }
    return raf(this.drawAll.bind(this));
  };

  Player.prototype.drawTimer = function() {
    if (this.indicate < this.duration) {
      return this.$timer.innerHTML = this.timeFormat(this.indicate);
    } else {
      this.offset = this.duration;
      this.$timer.innerHTML = this.timeFormat(this.offset);
      this.playing = false;
      this.pause();
      this.offset = 0;
      classie.add(this.$playPauseIcon, 'icon-play');
      classie.remove(this.$playPauseIcon, 'icon-pause');
      return this.drawCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  };

  Player.prototype.drawProgress = function() {
    if (!this.dragging) {
      if (this.indicate <= this.duration) {
        return this.$progress.style.width = (this.indicate / this.duration * 100).toString() + '%';
      } else {
        return this.$progress.style.width = '100%';
      }
    }
  };

  Player.prototype.drawSpectrum = function() {
    var barWidth, height, i, j, offset, percent, ref, results, value;
    if (this.playing) {
      this.analyser.getByteFrequencyData(this.freqDomain);
      this.drawCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      results = [];
      for (i = j = 0, ref = this.fbc; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        value = this.freqDomain[i];
        percent = value / 256;
        height = this.canvasHeight * percent;
        offset = this.canvasHeight - height - 1;
        barWidth = this.canvasWidth / this.fbc * 1.2;
        this.drawCtx.fillStyle = '#f00';
        results.push(this.drawCtx.fillRect(i * barWidth, offset + 2, barWidth, height));
      }
      return results;
    }
  };

  Player.prototype.drawTimeVizualization = function() {
    var barWidth, height, i, j, offset, percent, ref, results, value;
    if (this.playing) {
      this.analyser.getByteTimeDomainData(this.timeDomain);
      this.drawCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      results = [];
      for (i = j = 0, ref = this.fbc; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        value = this.timeDomain[i];
        percent = value / 256;
        height = this.canvasHeight * percent;
        offset = this.canvasHeight - height - 1;
        barWidth = this.canvasWidth / this.fbc;
        this.drawCtx.fillStyle = '#ff4a4a';
        results.push(this.drawCtx.fillRect(i * barWidth, offset, 1, 1));
      }
      return results;
    }
  };

  Player.prototype.draggingTimer = function() {
    return this.$timer.innerHTML = this.timeFormat(this.offset);
  };

  Player.prototype.createFilter = function(frequency) {
    var filter;
    filter = this.audioCtx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = frequency;
    filter.Q.value = 1;
    filter.gain.value = 0;
    return filter;
  };

  Player.prototype.createFilters = function() {
    var filters, frequencies;
    frequencies = [70, 180, 320, 600, 1000, 3000, 6000, 12000, 14000, 16000];
    filters = frequencies.map(this.createFilter, this);
    filters.reduce((function(_this) {
      return function(prev, curr) {
        prev.connect(curr);
        return curr;
      };
    })(this));
    return filters;
  };

  Player.prototype.bindEqEvents = function() {
    [].forEach.call(this.$eqInputs, (function(_this) {
      return function(input, i) {
        return input.addEventListener('mousedown', _this.changeEqFilter.bind(_this));
      };
    })(this));
    return [].forEach.call(this.$eqPresetsLinks, (function(_this) {
      return function(a, i) {
        return a.addEventListener('click', _this.changeEqPreset.bind(_this));
      };
    })(this));
  };

  Player.prototype.changeEqFilter = function(e) {
    if (e.button === 0) {
      this.draggingEqFilter = true;
      this.createFilterPopup(e);
    }
    if (e.button === 2 && (this.popup != null)) {
      this.createFilterPopup(e);
      return document.body.removeChild(this.popup);
    }
  };

  Player.prototype.createFilterPopup = function(e) {
    var offsetLeft;
    offsetLeft = 50;
    this.popup = document.createElement("div");
    this.popup.style.position = 'absolute';
    this.popup.style.zIndex = 100;
    this.popup.style.padding = 5 + 'px ' + 10 + 'px';
    this.popup.style.left = e.pageX - offsetLeft + 'px';
    this.popup.style.background = '#555';
    this.popup.style.color = '#eee';
    this.popup.innerHTML = e.target.value;
    return document.body.appendChild(this.popup);
  };

  Player.prototype.updateFilter = function(e) {
    var index, input, parent, val;
    input = e.target;
    parent = input.parentNode;
    index = Array.prototype.indexOf.call(parent.children, input);
    val = input.value;
    this.eq[index] = val;
    [].forEach.call(this.$eqPresetsLinks, (function(_this) {
      return function(link, i) {
        return classie.remove(link.parentNode, 'active');
      };
    })(this));
    if (this.file) {
      return this.filters[index].gain.value = val;
    }
  };

  Player.prototype.updateFilterPopup = function(e) {
    var offsetLeft, offsetTop;
    offsetTop = 40;
    offsetLeft = 50;
    if ('-12' === e.target.value) {
      console.log('ohohohho');
      return this.popup.innerHTML = e.target.value;
    } else if ('12' === e.target.value) {
      return this.popup.innerHTML = e.target.value;
    } else {
      this.popup.style.top = e.pageY - offsetTop + 'px';
      return this.popup.innerHTML = e.target.value;
    }
  };

  Player.prototype.changeEqPreset = function(e) {
    var ar, link, preset;
    e.preventDefault();
    preset = e.target;
    if (!classie.has(preset.parentNode, 'active')) {
      [].forEach.call(this.$eqPresetsLinks, (function(_this) {
        return function(link, i) {
          return classie.remove(link.parentNode, 'active');
        };
      })(this));
      classie.add(preset.parentNode, 'active');
      link = preset.getAttribute('href').slice(1);
      ar = PRESETS[link];
      return [].forEach.call(this.$eqInputs, (function(_this) {
        return function(input, i) {
          input.value = ar[i];
          _this.eq[i] = ar[i];
          if (_this.file) {
            return _this.filters[i].gain.value = ar[i];
          }
        };
      })(this));
    }
  };

  Player.prototype.bindVizEvents = function() {
    var self;
    self = this;
    return [].forEach.call(this.$vizItems, function(a, i) {
      return a.addEventListener('click', function(e) {
        e.preventDefault();
        if (!classie.has(this, 'active')) {
          [].forEach.call(self.$vizItems, (function(_this) {
            return function(item, i) {
              return classie.remove(item, 'active');
            };
          })(this));
          classie.add(this, 'active');
          return self.typeVizualization = this.dataset.viz;
        }
      });
    });
  };

  Player.prototype.timeFormat = function(sec) {
    var addZero, minutes, seconds;
    seconds = sec % 60;
    minutes = sec / 60;
    addZero = function(val) {
      val = Math.floor(val);
      if (val < 10) {
        return '0' + val;
      } else {
        return val;
      }
    };
    return addZero(minutes) + ':' + addZero(seconds);
  };

  return Player;

})();

playerElement = document.querySelector('.player');

window.player = new Player(playerElement);

tabs = (function() {
  var init;
  init = function() {
    var content;
    tabs = document.querySelectorAll('.tabs__item a');
    content = document.querySelector('.content');
    return [].forEach.call(tabs, function(tab, i) {
      return tab.addEventListener('click', function(e) {
        var con, cons, link;
        e.preventDefault();
        if (!classie.has(this.parentNode, 'active')) {
          [].forEach.call(tabs, function(tab, i) {
            return classie.remove(tab.parentNode, 'active');
          });
          classie.add(this.parentNode, 'active');
          link = this.getAttribute('href').slice(1);
          cons = content.querySelectorAll('.content__item');
          [].forEach.call(cons, function(con, i) {
            return classie.remove(con, 'active');
          });
          con = content.querySelector('.' + link);
          return classie.add(con, 'active');
        }
      });
    });
  };
  return {
    init: init
  };
})();

tabs.init();
