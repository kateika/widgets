(function(){
  
var $wrapper;

var date = new Date(2011, 0, 1);

var calendar = {};
calendar.year = date.getFullYear();
calendar.month = date.getMonth() + 1;
calendar.currentDay = date.getDate();
calendar.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
calendar.title = calendar.monthNames[calendar.month] + " " + calendar.year;
calendar.days = $("td.calendar__day:not(.calendar__day_disabled)");
calendar.currentDay = $(calendar.days[calendar.currentDay-1]).addClass("calendar__day_today");
calendar.selectedDays = [];

calendar.autoClose = function() {
  setTimeout(closeForm, 2000);
}

$(".calendar__current-month").text(calendar.title);
  
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

/*$("#check-in").attr("min", calendar.createDate(calendar.currentDay));
$("#check-out").attr("min", calendar.createDate(calendar.currentDay));*/
  
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

$(".calendar .button").on("click", function() {
  openForm($(".room-search"));
  //Убираем предыдущие помеченные ошибки
  $(".error").each(function() {
    $(this).removeClass("error");
  });
});


//Обработка события "submit"
$(".room-search form").on("submit", function() {
  event.preventDefault();
  
  //Убираем предыдущие помеченные ошибки (конкретно здесь это надо,если отменить закрытие формы через 2 секунды)
  $(".error").each(function() {
    $(this).removeClass("error");
  });
  
  //сохраняем значения, которые ввели в поля
  var checkInValue = $("#check-in").val();
  var checkOutValue = $("#check-out").val();
  var valid = true;
  
  if (checkInValue === "") {
    valid = false;
    $("#check-in").addClass("error");
  }
  
  if (checkOutValue === "") {
    valid = false;
    $("#check-out").addClass("error");
  }
  
  //Проверяем заполнены ли оба поля, чтобы передать их в функцию calendar.parseDate(), иначе
  //при парсе будет ошибка
  if(!valid) {
    calendar.autoClose();
    return;
  }

  var checkInDate = calendar.parseDate(checkInValue);
  var checkOutDate = calendar.parseDate(checkOutValue);
   
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
  while (calendar.days[endDay] && calendar.days[endDay].classList.contains("calendar__day_selected")) {
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
//Превращаю jQuery массив в обычный и переворачиваю, чтобы потом было удобнее 
//работать (см ниже chart.scalePoints.forEach)
chart.scalePoints = $(".chart__scale-point").get().reverse();

$(".chart__button").on("click", function(event) {
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
    //Ограничение в 9999 - искусственное, график хорошо работает при любых значениях
    var value = +$(this).val();
    if (value < 0 || value > 9999 || isNaN(value)) {
      $(this).addClass("error");
    }
    return value;
  }).get();
  
  
  $(".chart__column").each(function(index) {
    //Находим максимальное значение из введенных
    if (chart.columnValues[index] >= chart.maxColumnValue) {
      chart.maxColumnValue = chart.columnValues[index];
    }
  })

  //210 = 70px * 3 секции. Нахожу цену деления графиков
  chart.scalePoint = 210 / chart.maxColumnValue;

  //Находим, какая разница между числами должна быть в подписях шкалы
  var section = chart.maxColumnValue / 3;

  //Подписываем секции, как раз индекс совпадает с числом, на которой надо умножить section
  chart.scalePoints.forEach(function(point, index) {
    $(point).text(Math.round(section * index));
  });

  //Перезаписываю старые значения на новые, чтобы уже новые значения появились в 
  //следующий раз в инпутах при открытии формы
  $(".chart__column").each(function(index) {
    $(this).find(".chart__column-value").text(chart.columnValues[index]);
    $(this).css("height", chart.columnValues[index] * chart.scalePoint + "px");
  })


  //Решила вместо value=true/false сделать так, но это наверное менее предпочтительный 
  //вариант, потому что снова трясем DOM?
  if (!($(".chart__content").hasClass("error"))) {
    closeForm();
  }
});




/*********************PLACE*******************/
var place = {};
place.counter = +($(".place__likes").text());
place.tabs = $(".place__actions a");
place.activeInfo = $("#place__descr");
place.activeTab = $(".place__action_active");

var $likes = $(".place__likes");
  
//По клику на лайк не должно срабатывать контекстное меню
$likes.on("contextmenu", function(event) {
  event.preventDefault();
})

/*Приходится ставить прослушивание на mousedown,а не на click,так
как он вообще не срабатывает для правой клавиши, когда мы делаем
event.preventDefault() на контекстное меню*/
$likes.on("mousedown", function(event) {
  event.preventDefault();

  $likes.addClass("like");
  
  setTimeout(function() {
    $likes.removeClass("like");
  }, 500);
  
   
  if($likes.hasClass("dislike")) {
    $likes.removeClass("dislike");
  };

  if (event.button == 2) {
    place.counter += 1;
    $(".place__likes").text(place.counter);
  }
})

//Обычный клик левой кнопкой мыши работает хорошо
$likes.on("click", function(event) {
  event.preventDefault();
  
  $likes.addClass("dislike");
  
  setTimeout(function() {
    $likes.removeClass("dislike");
  }, 500);
  
  if($likes.hasClass("like")) {
    $likes.removeClass("like");
  };

  if (event.button == 0) {
    place.counter -= 1;
    $(".place__likes").text(place.counter);
  }
})


//Переключатель табов
$(".place__actions").on("click", function(event) {
  event.preventDefault();
  var $target = $(event.target);

  if ($target.hasClass("place__action-info")) {
    toggleTab($target, $("#place__descr"));
  }
  if ($target.hasClass("place__action-location")) {
    toggleTab($target, $("#place__map"));
  }
  if ($target.hasClass("place__action-fav")) {
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

$(".place__comments").on("click", function(event) {
  event.preventDefault();
  openForm($(".email"));
  $(".recepients input.input__content").focus();
  //Очистка полей формы перед новым комментарием
  if(commentForm.recepients.length > 0) {
    $(".input__tokens").css("paddingLeft", "13px").text('Click on "+" button to add email');
  }
  $(".email .input__content").val("");
})


//comment form

var commentForm = {};
commentForm.recepients = [];
commentForm.recepientsInput = $(".recepients input[name=emails]");

$(".email form").on("submit", function(event) {
  event.preventDefault();
  
  //Запоминаю текущее количество комментариев
  var numberOfComments = +($(".place__comments").text());
  var subject = $(".email input.input__content").val();
  var message = $(".email textarea.input__content").val();
  
  $(".error-comments").each(function() {
    $(this).removeClass("error-comments");
  });

  /*Я не валидирую емэйл еще как-то, так как по моей задумке пользователь не может
  писать адрес сам-только выбирать из списка. Контрол, который имел в виду дизайнер сделать я не успею*/
  if (!commentForm.recepients.length) {
    $(".recepients").addClass("error-comments");
  }
  
  if (subject === "") {
    $(".subject").addClass("error-comments");
  }
  
  if (message === "") {
    $(".message").addClass("error-comments");
  }
  
  if (!($(".email__input").hasClass("error-comments"))) {
    closeForm();
    //Так красивее:)
    $(".place__comments").text(numberOfComments += 1);
  }
  
})

$(".cancel").on("click", function(event) {
  event.preventDefault();
  closeForm();
})


$(".email__picker").on("click", function(event) {
  event.preventDefault();
  $(".list__recepients").toggle("fast");
})

$(".list__recepients .token").on("click", function(event) {
  event.preventDefault();
  var $target = $(event.target);
  //Чтобы адрес не удалялся из основного списка
  var $recepient = $target.closest(".token").clone();
  
  //Подправляем css стили
  if(!commentForm.recepients.length) {
    $(".input__tokens").css("paddingLeft", "3px").text("");
  }
  
  
  
  //Текст мейла
  var email = $recepient.find(".token__value").text();
  
  //Адрес мейла смотрим в нашем массиве, чтобы не добавлять его повторно в инпут
  if(commentForm.recepients.indexOf(email) !== -1) {
    $(".list__recepients").hide();
    return;
  }

  //Если такого мейла еше нет,то добавляем его в DOM, и в массив, потом будем использовать, чтобы добавлять в
  //инпут, валидировать форму (массив нужен, чтобы не запрашивать инфу у DOM).
  $(".input__tokens").append($recepient);
  commentForm.recepients.push(email);
  

  //Так как у нас ненастоящий инпут, а див и input type="hidden", то надо в этот
  //инпут передать значения введенных мейлов, чтобы отправить на сервер
  commentForm.recepientsInput.val(commentForm.recepients.join(","));
  $(".list__recepients").hide();
  
  //Мы добавляем обработчик на кнопку удаления у клонированной ноды
  $recepient.find(".token__button").on("click", function() {
    $recepient.remove();
    //Удаляем мейл из списка (m - мейл)
    commentForm.recepients = commentForm.recepients.filter(function(m) { return m != email; });
    commentForm.recepientsInput.val(commentForm.recepients.join(","));
    //Когда удаляем все мейлы, то надо снова вставить надпись о кнопке
    if(!commentForm.recepients.length) {
      $(".input__tokens").css("paddingLeft", "13px").text('Click on "+" button to add email');
    }
  })
})



//type file
$(".email__file-picker input[type=file]").on("change", function() {
  var li;
  $(this.files).each(function(index, file) {
    li = $("<li/>").text(file.name);
    //Изначально прячем, чтобы не менять css стили
    $("#file__list").show().append(li);
  })
})

})();