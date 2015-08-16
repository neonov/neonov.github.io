(function () {
  // =========================
  // Popup
  // ========================
  var thead = document.querySelector('.table__header');
  var rows = document.querySelectorAll('.table tbody tr');
  var hrow = document.querySelector('.table__header tr');
  var htds = hrow.querySelectorAll('th');
  var b = [];
  var popup = null;

  [].forEach.call(htds, function (htd, i) {
    if (htd.className != 'type-airbus-min') {
      b.push(htd.textContent);
    }
  });

  [].forEach.call(rows, function (row) {
    row.addEventListener('click', function (e) {
      if (!(this.classList.contains('active'))) {
        [].forEach.call(rows, function (row) {
          row.classList.remove('active');
        });

        this.classList.add('active');
        var isPopup;
        if (isPopup = document.querySelector('.popup')) {
          document.body.removeChild(isPopup);
        }

        tds = this.querySelectorAll('td');
        var a = [];
        [].forEach.call(tds, function (td) {
          if (td.className != 'type-airbus-min') {
            a.push(td.textContent);
          }
        });
        var str = '';
        for (var i = 0; i < a.length; i++) {
          str += (b[i] + ': ' + a[i] + '<br>');
        }
        var popup;
        popup = document.createElement("div");
        popup.style.position = 'absolute';
        popup.className = 'popup';
        popup.style.zIndex = 99;
        popup.style.padding = 20 + 'px ' + 30 + 'px';
        popup.style.left = e.pageX + 20 + 'px';
        popup.style.top = e.pageY  + 20 + 'px';
        popup.style.background = '#555';
        popup.style.color = '#eee';
        popup.style.lineHeight = 1.5;
        popup.innerHTML = str;
        document.body.appendChild(popup);
      }
      else {
        if (isPopup = document.querySelector('.popup')) {
          document.body.removeChild(isPopup);
        }
        this.classList.remove('active');
      }
    });
  });


  // =========================
  // Fix thead
  // ========================
  document.addEventListener('scroll', function () {
    if ((document.documentElement.scrollTop || document.body.scrollTop) >= 140) {
      thead.classList.add('table__header--scroll');
    }
    else {
      thead.classList.remove('table__header--scroll');
    }
  });
})();
