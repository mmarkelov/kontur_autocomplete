$('document').ready(function(){

    const autocomplete = $('#autocomplete');
    const search = $('#search');
    const result = $('#result');
    const pointer = $('.input-group-addon');
    const warning = $('.warning');
    const error = $('.error');
    const info = $('.info');
    const addValue = $('.add-value');

    var searchString = '';

    const defaultValues = ["Москва", "Санкт-Петербург", "Екатеринбург"];
    result.html(defaultValues.map((item) => `<li>${item}</li>`)).append('<hr>');
    result.append('<li id="loader"><i class="fa fa-spinner fa-pulse fa-lg fa-fw"></i> Загрузка</li>');

    autocomplete.hide();
    warning.hide();
    error.hide();
    info.hide();
    addValue.hide();

    var autocompleteHeight = autocomplete.height();
    var autocompleteScrollHeight = autocomplete[0].scrollHeight;

    const quantityElements = 15;
    const autocompleteDefaultHeight = 150;

    function Unique(A) {
        var n = A.length, k = 0, B = [];
        for (var i = 0; i < n; i++) { 
            var j = 0;
            while (j < k && B[j] !== A[i]) j++;
            if (j == k) B[k++] = A[i];
        }

        return B;
    }

    var firstAlphabetElements = [];

    var firstElementPosition, lastElementPosition;

    $.post(
        'http://localhost:3090/getelements',
        {
            firstElementPosition: 0,
            lastElementPosition: 50
        },
        function(data) {
            firstAlphabetElements = data;
            firstElementPosition = firstElementPosition;
            lastElementPosition = lastElementPosition;
            result.append(firstAlphabetElements.map((item) => `<li>${item.City}</li>`));
            $('li:first').addClass('selected');
        }
    ).fail(function(){
        result.html('<li class="server-error">Что-то пошло не так. Проверьте соединение с интернетом и попробуйте еще раз</li>');
        autocomplete.height(result.outerHeight());   
    }).done(function() {
        $('#loader').remove();
    });

    pointer.click(function() {
        search.focus();
        autocomplete.show();
    });

    search.keydown(function(e) {

        autocomplete.show();

        var activeLI = $('.selected');
        var currentLI = $('li:first');

        if (e.keyCode === 40) {
            if (activeLI.next().length) {
                currentLI = activeLI.next(); 
            } else {
                currentLI = $('li:first');
                autocomplete.scrollTop(0);
            }
        }

        if (e.keyCode === 38) {
            if (activeLI.prev().length) {
                currentLI = activeLI.prev();
            } else {
                currentLI = $('li:last');
                autocomplete.scrollTop(0);
            }
        }

        if (e.keyCode === 13) {
            if (addValue.is(':visible')) {
                search.val(searchString).change();
                $.post(
                    'http://localhost:3090/add',
                    {
                        searchString: searchString
                    },
                    function(data) {
                        if (data === true) {
                            info.html(`Значение «${search.val()}» было успешно добавлено в справочник`);
                            info.show();
                        }
                    }
                );
            } else if($('.selected').length !== 0){
                search.val($('.selected').text());
            } else {
                search.val(searchString);
                addValue.html(`+ Добавить «${searchString}»`);
                addValue.show();
            }
            autocomplete.scrollTop(0);
            searchString = '';
            autocomplete.hide();
        }

        currentLI.addClass('selected');
        activeLI.removeClass('selected');

        if ($('.selected').length !== 0) {
            if ($('.selected').position().top + autocompleteScrollHeight >= autocomplete.scrollTop() + autocompleteHeight) {
                autocompleteScrollHeight = autocomplete[0].scrollHeight;
                autocomplete.scrollTop($('.selected').position().top - autocomplete.height() + autocomplete.scrollTop());
            }
        }
    });

    autocomplete.on("mousedown", function(e) {
        warning.hide();

        if (addValue.is(':visible')) {
            search.val(searchString).change();
            $.post(
                'http://localhost:3090/add',
                {
                    searchString: searchString
                },
                function(data) {
                    if (data === true) {
                        info.html(`Значение «${search.val()}» было успешно добавлено в справочник`);
                        info.show();
                        error.hide();
                        search.removeClass('warning-input');
                        search.removeClass('error-input');
                        search.addClass('info-input');
                    }
                }
            );
        } else {
            setTimeout(function() {
                search.val($(e.target).closest('li').text());
            }, 10);
            autocomplete.scrollTop(0);
            searchString = '';
            $(this).hide(); 
        }
    });

    autocomplete.hover(function() {
        $('li').removeClass('selected');
    });

    search.focus(function() {
        autocomplete.show();
        warning.hide();
        error.hide();
        info.hide();
        addValue.hide();

        search.removeClass('error-input');
        search.removeClass('info-input');

        $(this).attr("placeholder", "Начните вводить название");
        $('li:first').addClass('selected');
        firstElementPosition = 0;
        lastElementPosition = firstElementPosition + quantityElements;

        if (searchString === '') {
            firstElementPosition = 50;
            lastElementPosition = firstElementPosition + quantityElements;
        }
    });

    autocomplete.scroll(function() {
        autocompleteScrollHeight = autocomplete[0].scrollHeight;
        if (autocomplete.scrollTop() >= autocompleteScrollHeight - autocompleteHeight) {
            $.ajax({
                type: 'POST',
                url: 'http://localhost:3090/getelements',
                beforeSend: function() {
                    result.append('<li id="loader"><i class="fa fa-spinner fa-pulse fa-lg fa-fw"></i> Загрузка</li>');
                },
                data: {
                    firstElementPosition: firstElementPosition,
                    lastElementPosition: lastElementPosition,
                    searchString: searchString
                },
                success: function(data) {
                    if (data.length !== 0) {
                        firstElementPosition += quantityElements;
                        lastElementPosition += quantityElements;
                    }
                           
                    let cities = data.map((item) => item.City);
                    result.append(Unique(cities).map((item) => `<li>${item}</li>`));
                }
            }).done(function() {
                $('#loader').remove();
            });   
        }
    });

    search.keyup(function(e) {
        warning.hide();
        error.hide();
        addValue.hide();
        autocomplete.height(autocompleteDefaultHeight);
        addValue.html('');
        search.removeClass('warning-input');
        search.removeClass('error-input');
        search.removeClass('info-input');
        if (e.keyCode !== 40 && e.keyCode !== 38) {
            firstElementPosition = 0;
            lastElementPosition = firstElementPosition + quantityElements;
            
            searchString = $(this).val();

            $.ajax({
                type: 'POST',
                url: 'http://localhost:3090/getelements',
                beforeSend: function() {
                    result.append('<li id="loader"><i class="fa fa-spinner fa-pulse fa-lg fa-fw"></i> Загрузка</li>');
                },
                data: {
                    firstElementPosition: firstElementPosition,
                    lastElementPosition: lastElementPosition,
                    searchString: searchString
                },
                success: function(data) {
                    if (data.length === 0) {
                        warning.show();
                        addValue.html(`+ Добавить «${searchString}»`);
                        addValue.show();
                        autocomplete.height(addValue.outerHeight());
                        search.addClass('warning-input');
                    }    
                    if (data.length !== 0) {
                        firstElementPosition += quantityElements;
                        lastElementPosition += quantityElements;
                    }

                    let cities = data.map((item) => item.City);
                    result.html(Unique(cities).map((item) => `<li>${item}</li>`));
                    if ((result.outerHeight() < autocomplete.height()) && (addValue.html() === '')) {
                        autocomplete.height(result.outerHeight());
                    }
                    $('li:first').addClass('selected');
                    autocomplete.scrollTop(0);

                }
            }).done(function() {
                $('#loader').remove();
            });
        }
    });

    search.focusout(function() {
        info.hide();
        warning.hide();

        if (addValue.is(':visible')) {
            error.show();
            search.addClass('error-input');
        }

        search.removeClass('warning-input');
        search.removeClass('info-input');
        search.css("border", "default");
        searchString = '';
        result.html(defaultValues.map((item) => `<li>${item}</li>`)).append('<hr>');
        result.append(firstAlphabetElements.map((item) => `<li>${item.City}</li>`));
        $('li').removeClass('selected');
        autocomplete.height(autocompleteDefaultHeight);
        autocomplete.scrollTop(0);
        autocomplete.hide();

        $(this).attr("placeholder", "Введите или выберете из списка");
    });

});