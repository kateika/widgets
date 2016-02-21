var $wrapper;

var calendar = {};
calendar.year = 2016;
calendar.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
calendar.month = 1;
calendar.title = $(".calendar__current-month");
calendar.days = $("td.calendar__day:not(.calendar__day_disabled)");
calendar.selectedDays = [];

calendar.autoClose = function() {
  setTimeout(closeForm, 2000);
}

calendar.parseDate = function(dateStr) {
  var date = new Date(dateStr);
  var day = date.getDate();
  var month = date.getMonth();
  var year = date.getFullYear();
  return {day: day, month: month, year: year};
}

calendar.createDate = function(day) {
  var month = ("00" + calendar.month).slice(-2);
  var date = ("00" + day).slice(-2);
  return calendar.year + "-" + month + "-" +date;
}


function openForm($target) {
  $target.addClass("modal-form").show();
  //создаем враппер, чтобы ловить потом на нем клики и скрывать форму
  $wrapper = $("<div>")
    .insertBefore(".room-search")
    .css({
      position: "fixed",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,.2)",
      top: 0,
      left: 0,
      zIndex: 1
  });
  
  $wrapper.click(closeForm);
}

function closeForm() {
  $(".modal-form").removeClass("modal-form").hide();
  $wrapper.remove();
}


//Изменение месяца
$(".calendar__month-prev").on("click", function() {
  event.preventDefault();
  calendar.month--;
  if (calendar.month == -1) {
    calendar.month = 11;
    calendar.year--;
  }
  calendar.title.text(calendar.monthNames[calendar.month] + " " + calendar.year);
});

$(".calendar__month-next").on("click", function() {
  event.preventDefault();
  calendar.month++;
  if (calendar.month == 12) {
    calendar.month = 0;
    calendar.year++;
  }
  calendar.title.text(calendar.monthNames[calendar.month] + " " + calendar.year);
});


$(".calendar .button").on("click", function() {
  openForm($(".room-search"));
});


//Обработка события "submit"
$(".room-search form").on("submit", function() {
  event.preventDefault();
  
  //Убираем предыдущие помеченные ошибки
  $(".error").each(function() {
    $(this).removeClass("error");
  });
  
  //сохраняем значения, которые ввели в поля
  var $checkInValue = $("#check-in").val();
  var $checkOutValue = $("#check-out").val();
  var valid = true;
  
  if ($checkInValue === "") {
    valid = false;
    $("#check-in").addClass("error");
  }
  
  if ($checkOutValue === "") {
    valid = false;
    $("#check-out").addClass("error");
  }
  
  //Проверяем заполнены ли оба поля, чтобы передать их в функцию calendar.parseDate(), иначе
  //при парсе будет ошибка
  if(!valid) {
    calendar.autoClose();
    return;
  }

  var checkInDate = calendar.parseDate($checkInValue);
  var checkOutDate = calendar.parseDate($checkOutValue);
   
  //Проверяем, чтобы дата въезда была раньше даты выезда (выбрать можно только
  //текущий месяц и год)
  if (checkInDate.day > checkOutDate.day 
      || checkInDate.month !== checkOutDate.month 
      || checkInDate.year !== checkOutDate.year) {
    valid = false;
    $(".room-search__date").addClass("error");
  }
  
  //В данном случае проверяем введенный месяц и год с текущим месяцем и годом календаря
  if (checkInDate.month !== calendar.month && checkInDate.year !== calendar.year) {
    valid = false;
    $(".room-search__date").addClass("error");
  }
  
  
  var day;
  //Если какой-нибудь день из выбранного периода оказывается забронированным раньше
  //- подсвечиваем ошибку
  validate: for (var i = checkInDate.day - 1; i < checkOutDate.day; i++) {
    day = i + 1;
    for (var j = 0; j < calendar.selectedDays.length; j++) {
      if (day == calendar.selectedDays[j]) {
        valid = false;
        $(".room-search__date").addClass("error");
        break validate;
      }
    }
  }
  
  //Снова проверяем валидность заполнения
  if (!valid) {
    calendar.autoClose();
    return;
  }
  
  for (var i = checkInDate.day - 1; i < checkOutDate.day; i++) {
    calendar.days[i].classList.add("calendar__day_selected");
    //добавляем в массив забронированные дни
    calendar.selectedDays.push(i+1);
  }
  
  closeForm();
})


/*Сценарий2: по клику на помеченном числе из формы1 снова открывается форма2, но
уже ЗАПОЛНЕННАЯ информацией.*/
$(".calendar__day-picker").on("click", function() {
  var $target = $(event.target);
  if (!$target.hasClass("calendar__day_selected")) return;
  
  //Начинаем искать последний и первый день из промежутка, начиная с выбранной даты
  var endDay = +$target.text();
  var startDay = +$target.text();
  
  while (calendar.days[endDay].classList.contains("calendar__day_selected")) {
    endDay++;
  }

  while (calendar.days[startDay-2].classList.contains("calendar__day_selected")) {
    startDay--;
  }
  
  
  $("#check-in").val(calendar.createDate(startDay));
  $("#check-out").val(calendar.createDate(endDay));
  openForm($(".room-search"));
})



/**********************CHART****************/
var chart = {};
chart.fields = $(".chart__content");
//Собираю текущие значения высот столбиков
chart.columnValues = $(".chart__column-value").map(function() {
  return +$(this).text();
}).get();
//Присваиваем максимальное значение для начала первому значению
chart.maxColumnValue = chart.columnValues[0];
//Цена деления
chart.scalePoint = 0;
//Превращаю jQuery массив в обычный и переворачиваю, чтобы потом было удобнее работать (см ниже chart.scalePoints.forEach)
chart.scalePoints = $(".chart__scale-point").get().reverse();

$(".chart__button").on("click", function() {
  event.preventDefault();
  openForm($(".modal-chart-form"));
  
  //Вставляю в инпуты собранные заранее текущие значения высот столбиков
  $(".chart__content").each(function(index) {
    $(this).val(chart.columnValues[index]);
  });
  
  $(".chart__content").first().focus();
})

$(".modal-chart-form form").on("submit", function() {
  event.preventDefault();
  
  //Собираю введенные значения высот в обычный массив
  chart.columnValues = $(".chart__content").map(function() {
    if(+$(this).val() < 0 || +$(this).val() > 9999) {
      return +$(this).addClass("error");;
    }
    return +$(this).val();
  }).get();
  
  
  $(".chart__column").each(function(index) {
    //Находим максимальное значение из введенных
    if(chart.columnValues[index] >= chart.maxColumnValue) {
      chart.maxColumnValue = chart.columnValues[index];
    }
  })

  //207 = 69px * 3 секции. Нахожу цену деления графиков
  chart.scalePoint = 207 / chart.maxColumnValue;

  //Находим, какая разница между числами должна быть в подписях шкалы
  var section = Math.ceil(chart.maxColumnValue / 3);

  //Подписываем секции, как раз индекс совпадает с числом, на которой надо умножить section
  chart.scalePoints.forEach(function(point, index) {
    $(point).text(section * index);
  });

  //Перезаписываю старые значения на новые, чтобы уже новые значения появились в следующий раз в инпутах при открытии формы
  $(".chart__column").each(function(index) {
    $(this).find(".chart__column-value").text(chart.columnValues[index]);
    $(this).css("height", chart.columnValues[index] * chart.scalePoint + "px");
  })


  //Решила вместо value=true/false сделать так, но это наверное менее предпочтительный вариант, потому что снова трясем DOM?
  if(!($(".chart__content").hasClass("error"))) {
    closeForm();
  }
});





/*********************PLACE*******************/
var place = {};
place.counter = +($(".place__likes").text());
place.tabs = $(".place__actions a");
place.activeInfo = $("#place__descr");
place.activeTab = $(".place__action_active");

//По клику на лайк не должно срабатывать контекстное меню
$(".place__likes").on("contextmenu", function() {
  event.preventDefault();
})

/*Приходится ставить прослушивание на mousedown,а не на click,так
как он вообще не срабатывает для правой клавиши, когда мы делаем
event.preventDefault() на контекстное меню*/
$(".place__likes").on("mousedown", function() {
  event.preventDefault();
  if(event.button == 2) {
    place.counter += 1;
    $(".place__likes").text(place.counter);
  }
})

//Обычный клик левой кнопкой мыши работает хорошо
$(".place__likes").on("click", function() {
  event.preventDefault();
  if(event.button == 0) {
    place.counter -= 1;
    $(".place__likes").text(place.counter);
  }
})

//Переключатель табов
$(".place__actions").on("click", function() {
  event.preventDefault();
  var $target = $(event.target);

  if($target.hasClass("place__action-info")) {
    toggleTab($target, $("#place__descr"));
  }
  if($target.hasClass("place__action-location")) {
    toggleTab($target, $("#place__map"));
  }
  if($target.hasClass("place__action-fav")) {
    toggleTab($target, $("#place__favourite"));
  }
})

function toggleTab(tab, info) {
  place.activeInfo.hide();
  place.activeTab.removeClass("place__action_active");
  tab.addClass("place__action_active");
  info.show();
  place.activeInfo = info;
  place.activeTab = tab;
}

$(".place__comments").on("click", function() {
  event.preventDefault();
  openForm($(".email"));
})