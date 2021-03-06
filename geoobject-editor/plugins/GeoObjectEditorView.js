define(['ready!ymaps', 'jquery'/*, 'bootstrap'*/], function (ymaps, $) {

    var BaseFieldsetMethods = {
        build: function () {
            var el = this.getParentElement(),
                geoObject = this.geoObject = this.getData().geoObject,
                geometryType = geoObject.geometry.getType();

            this.layout = geometryType + 'Fieldset';

            views[this.layout].superclass.build.call(this);

            this.styleGroupControls = $('[name=fill],[name=stroke]')
                .on('change', $.proxy(this.onStyleGroupChange, this));

            this.styleFields = $('[name^=icon],[name^=stroke],[name^=fill],[name^=border]', el)
                .on('change', $.proxy(this.onStyleChange, this));

            this.geometryFields = $('[name=center],[name=width],[name=height],[name=radius]', el)
                .on('change', $.proxy(this.onGeometryChange, this));

            this.tabs = $('[data-toggle=tab]')
                .on('shown', $.proxy(this.onTabShown, this));
            this.tabs = $('[data-toggle=tab]')
                .on('click', $.proxy(this.onTabClick, this));

            // this.setFieldsValues(this.styleFields);
            // this.setGroupControlsState();
        },
        clear: function () {
            this.styleFields.off('change');
            this.geometryFields.off('change');
            this.tabs.off('click shown');

            views[this.layout].superclass.clear.call(this);
        },
        onTabClick: function (e) {
            var target = $(e.target).data('target'),
                geoObject = this.geoObject,
                activetab = geoObject.properties.get('activetab');

            e.preventDefault();

            for(var tab in activetab) {
                activetab[tab] = tab === target;
            }

            geoObject.properties.set('activetab', activetab);
        },
        onTabShown: function (e) {
            this.events.fire('change');
        },
        getFieldsValues: function (fields) {
            var result = {};

            fields.each(function () {
                result[this.name] = this.value;
            });

            return result;
        },
        setFieldsValues: function (fields) {
            var props = fields.map(function () { return this.name; }).get();

            props.forEach(function (prop) {
                var geoObject = this.geoObject,
                    value = geoObject.options.get(prop) || geoObject.properties.get(prop);

                if(value) {
                    fields.filter('[name=' + prop + ']').val(value);
                }
            }, this);
        },
        onStyleChange: function (e) {
            this.updateGeoObject(this.getFieldsValues(this.styleFields));
        },
        onStyleGroupChange: function (e) {
            var self = this,
                field = $(e.target);
                prefix = field.data('control'),
                container = field.closest('.control-group'),
                controls = container.nextAll('.control-group:has([name^=' + prefix + '])');

            if(field.is(':checked')) {
                controls.find(':input').removeAttr('disabled');
            }
            else {
                controls.find(':input').attr('disabled', 'disabled');
            }
            /*
            controls.animate({
                height: "toggle",
                opacity: "toggle"
            }, {
                duration: 'slow',
                step: function (now, fx) {
                    self.events.fire('change');
                }
            });
            controls.slideToggle('fast', $.proxy(function () {
                this.events.fire('change');
            }, this));
            */
            // controls.toggleClass('hide', field.not(':checked'));
            field.val(Number(field.is(':checked')));
            // this.updateGeoObject(this.getFieldsValues(field));
        },
        setGroupControlsState: function () {
            this.styleGroupControls.each(function () {
                var checked = Boolean(Number(this.value));

                if(this.checked !== checked) {
                    $(this)
                        .attr('checked', checked)
                        .change();
                }
            });
        },
        onGeometryChange: function (e) {},
        updateGeoObject: function (props) {
            var geoObject = this.geoObject;

            for(var key in props) {
                if(props[key]) {
                    isNaN(props[key]) || (props[key] = Number(props[key]));
                }
                else {
                    delete props[key];
                }
            }

            geoObject.options.set(props);
            geoObject.properties.set(props);
        }
    };

    var views = {
        EditForm: ymaps.templateLayoutFactory.createClass([
            '<form class="form-horizontal" style="padding-top: 15px">',
                '<fieldset>',
                    // '<legend>$[properties.editor.legend]</legend>',
                    '<div class="tabbable tabs-below">',
                    '<div class="tab-content">',
                        '<div class="tab-pane[if properties.activetab.info] active[endif]" id="tab-info">',
                            '<div class="control-group">',
                                '<label class="control-label">Название</label>',
                                '<div class="controls">',
                                    '<input class="input-xlarge" type="text" name="name" tabindex="1" placeholder="Название объекта" value="$[properties.name]"/>',
                                '</div>',
                            '</div>',
                            '<div class="control-group">',
                                '<label class="control-label">Описание</label>',
                                '<div class="controls">',
                                    '<textarea rows="3" class="input-xlarge" name="description" tabindex="2" placeholder="Описание объекта">$[properties.description]</textarea>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '$[[options.fieldsetLayout]]',
                    '</div>',
                        '$[[options.actionsLayout]]',
                    '<ul class="nav nav-tabs">',
                        '<li[if properties.activetab.info] class="active"[endif]><a href="#tab-info" data-target="info" data-toggle="tab">Информация</a></li>',
                        '<li[if properties.activetab.styles] class="active"[endif]><a href="#tab-styles" data-target="styles" data-toggle="tab">Стили</a></li>',
                        '<li[if properties.activetab.geometry] class="active"[endif]><a href="#tab-geometry" data-target="geometry" data-toggle="tab">Геометрия</a></li>',
                    '</ul>',
                    '</div>',
                '</fieldset>',
            '</form>'
        ].join(''), {
            build: function () {
                this.layout = 'EditForm';
                views[this.layout].superclass.build.call(this);

                var el = this.getParentElement(),
                    geoObject = this.geoObject = this.getData().geoObject;

                this.form = $('form', el)
                    .on('submit', $.proxy(this.onSubmit, this));

                this.fields = $('[name=name],[name=description]', el)
                    .on('change', $.proxy(this.onChange, this));
            },
            clear: function () {
                this.form.off('submit');
                this.fields.off('change');

                views[this.layout].superclass.clear.call(this);
            },
            onChange: function (e) {
                var field = $(e.target),
                    geoObject = this.geoObject;

                geoObject.properties.set(field.attr('name'), field.val());
            },
            onSubmit: function (e) {
                var geoObject = this.geoObject,
                    geoObjectEditor = geoObject.properties.get('editor');

                e.preventDefault();

                geoObjectEditor.stopEditing();
            }
        }),

        EditFormActions: ymaps.templateLayoutFactory.createClass([
            '<div class="form-actions">',
                '<button type="submit" class="btn btn-primary">Сохранить</button>',
                '<button type="reset" class="btn" style="margin-left: 10px">Отменить</button>',
            '</div>'
        ].join(''), {
            build: function () {
                this.layout = 'EditFormActions';
                views[this.layout].superclass.build.call(this);

                var el = this.getParentElement(),
                    geoObject = this.geoObject = this.getData().geoObject;

                this.reset = $('[type=reset]', el)
                    .on('click', $.proxy(this.onCancel, this));
            },
            clear: function () {
                this.reset.off('click');

                views[this.layout].superclass.clear.call(this);
            },
            onCancel: function (e) {
                e.preventDefault();

                this.geoObject.getParent()
                    .events.fire('actiondelete', {
                        type: 'actiondelete',
                        target: this.geoObject
                    });
            }
        }),

        PointFieldset: ymaps.templateLayoutFactory.createClass([
            '<div class="control-group">',
                '<label class="control-label">Координаты</label>',
                '<div class="controls">',
                    '<input class="input-xlarge" type="text" name="center" tabindex="3" value="$[geometry.coordinates]"/>',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Адрес</label>',
                '<div class="controls">',
                    '<input class="input-xlarge" type="text" name="address" tabindex="4" placeholder="Адрес объекта" value="$[properties.address]"/>',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Тип иконки</label>',
                '<div class="controls">',
                    '<select class="input-xlarge" tabindex="5" name="iconStyle">',
                        '<option value="Icon">Метки без содержимого</option>',
                        '<option value="DotIcon">Метки без содержимого с точкой в центре</option>',
                        '<option value="StretchyIcon">Метки с текстом (иконки тянутся под контент)</option>',
                        // '<option value="standart">Стандартные значки (пиктограммы)</option>',
                    '</select>',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Цвет иконки</label>',
                '<div class="controls">',
                    '<select class="input-xlarge" tabindex="6" name="iconColor">',
                        '<option value="blue">Синий</option>',
                        '<option value="darkblue">Темно-синий</option>',
                        '<option value="green">Зеленый</option>',
                        '<option value="darkgreen">Темно-зеленый</option>',
                        '<option value="orange">Оранжевый</option>',
                        '<option value="darkorange">Темно-оранжевый</option>',
                        '<option value="pink">Розовый</option>',
                        '<option value="red">Красный</option>',
                        '<option value="yellow">Желтый</option>',
                        '<option value="brown">Коричневый</option>',
                        '<option value="violet">Фиолетовый</option>',
                        '<option value="night">Цвет ночи</option>',
                        '<option value="white">Белый</option>',
                        '<option value="grey">Серый</option>',
                        '<option value="black">Черный</option>',
                    '</select>',
                '</div>',
            '</div>'
        ].join(''), ymaps.util.extend({}, BaseFieldsetMethods, {
            build: function () {
                BaseFieldsetMethods.build.call(this);

                var geoObject = this.geoObject,
                    hasNoAddress = !geoObject.properties.get('address');

                if(hasNoAddress) {
                    this.setAddressFieldValue();
                }
            },
            onGeometryChange: function (e) {
                var geoObject = this.geoObject,
                    coordinates = $(e.target).val().split(',');

                geoObject.geometry
                    .setCoordinates(coordinates);

                this.setAddressFieldValue();

                setTimeout(function () {
                    geoObject.properties.get('balloon').autoPan();
                }, 0);
            },
            updateGeoObject: function (props) {
                var geoObject = this.geoObject,
                    view = geoObject.properties.get('view'),
                    geoObjects = geoObject.getParent(),
                    index = geoObjects.indexOf(geoObject),
                    preset = 'twirl#' + props.iconColor + props.iconStyle;

                geoObject.options.set('preset', preset)
                    .unset('iconContentLayout');

                geoObject.properties.set(props);

                switch(props.iconStyle) {
                    case 'StretchyIcon':
                        geoObject.options.set('iconContentLayout', view.getLayout('strechyIconContent'));
                        break;
                    case 'Icon':
                        index++ < 100 && geoObject.properties.set('iconContent', index);
                        break;
                    default:
                        geoObject.properties.unset('iconContent');
                }
            },
            setAddressFieldValue: function () {
                var geoObject = this.geoObject,
                    coordinates = geoObject.geometry.getCoordinates();

                ymaps.geocode(coordinates, { results: 1 })
                    .then(function (res) {
                        var result = res.geoObjects.get(0),
                            address = result && result.properties.get('text');

                        if(address) {
                            geoObject.properties.set('address', address);
                        }
                    });
            }
        })),

        LineStringFieldset: ymaps.templateLayoutFactory.createClass([
            '<div class="control-group">',
                '<label class="control-label">Цвет линии</label>',
                '<div class="controls">',
                    '<input type="text" name="strokeColor" tabindex="3" class="input-xlarge" placeholder="FFFFFFAA или rgba(255,0,0,1)" value="$[properties.strokeColor]">',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Толщина линии</label>',
                '<div class="controls">',
                    '<input type="text" name="strokeWidth" tabindex="4" class="input-micro" placeholder="1" value="$[properties.strokeWidth]">',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Стиль линии</label>',
                '<div class="controls">',
                    '<select class="input-xlarge" tabindex="5" name="strokeStyle">',
                        '<option value="solid">Сплошная линия</option>',
                        '<option value="dash">Тире</option>',
                        '<option value="dashdot">Длинное тире - короткое тире</option>',
                        '<option value="dot">Точки</option>',
                        '<option value="longdash">Длинные тире</option>',
                        '<option value="longdashdot">Очень длинное тире - точка</option>',
                        '<option value="longdashdotdot">Длинное тире - точка - точка</option>',
                        '<option value="shortdash">Короткие тире</option>',
                        '<option value="shortdashdot">Тире - точка</option>',
                        '<option value="shortdashdotdot">Тире - точка - точка</option>',
                        '<option value="shortdot">Точки через двойной интервал</option>',
                    '</select>',
                '</div>',
            '</div>'
        ].join(''), BaseFieldsetMethods),

        PolygonFieldset: ymaps.templateLayoutFactory.createClass([
            '<div class="control-group">',
                '<label class="control-label">Наличие</label>',
                '<div class="controls">',
                    '<label class="checkbox">',
                        '<input type="checkbox" name="stroke" tabindex="3" data-control="stroke" value="1">',
                        'обводки',
                    '</label>',
                    '<label class="checkbox">',
                        '<input type="checkbox" name="fill" tabindex="4" data-control="fill" value="1">',
                        'заливки',
                    '</label>',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Цвет заливки</label>',
                '<div class="controls">',
                    '<input type="text" name="fillColor" tabindex="5" class="input-xlarge" placeholder="FFFFFFAA или rgba(255,0,0,1)" value="$[properties.fillColor]">',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Цвет линии</label>',
                '<div class="controls">',
                    '<input type="text" name="strokeColor" tabindex="6" class="input-xlarge" placeholder="FFFFFFAA или rgba(255,0,0,1)" value="$[properties.strokeColor]">',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Толщина линии</label>',
                '<div class="controls">',
                    '<input type="text" name="strokeWidth" tabindex="7" class="input-micro" placeholder="1" value="$[properties.strokeWidth]">',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Стиль линии</label>',
                '<div class="controls">',
                    '<select class="input-xlarge" tabindex="8" name="strokeStyle">',
                        '<option value="solid">Сплошная линия</option>',
                        '<option value="dash">Тире</option>',
                        '<option value="dashdot">Длинное тире - короткое тире</option>',
                        '<option value="dot">Точки</option>',
                        '<option value="longdash">Длинные тире</option>',
                        '<option value="longdashdot">Очень длинное тире - точка</option>',
                        '<option value="longdashdotdot">Длинное тире - точка - точка</option>',
                        '<option value="shortdash">Короткие тире</option>',
                        '<option value="shortdashdot">Тире - точка</option>',
                        '<option value="shortdashdotdot">Тире - точка - точка</option>',
                        '<option value="shortdot">Точки через двойной интервал</option>',
                    '</select>',
                '</div>',
            '</div>'
        ].join(''), BaseFieldsetMethods),

        RectangleFieldset: ymaps.templateLayoutFactory.createClass([
            '<div class="tab-pane[if properties.activetab.geometry] active[endif]" id="tab-geometry">',
                '<div class="control-group">',
                    '<label class="control-label">Координаты центра</label>',
                    '<div class="controls">',
                        '<input class="input-xlarge" type="text" name="center" tabindex="3" value="$[properties.center]"/>',
                    '</div>',
                '</div>',
                '<div class="control-group">',
                    '<label class="control-label">Размер в метрах</label>',
                    '<div class="controls form-inline">',
                        '<input class="input-mini" type="text" name="width" tabindex="4" value="$[properties.width|0]"/>',
                        '&nbsp;x&nbsp;',
                        '<input class="input-mini" type="text" name="height" tabindex="5" value="$[properties.height|0]"/>',
                    '</div>',
                '</div>',
                '<div class="control-group">',
                    '<label class="control-label">Радиус скругления</label>',
                    '<div class="controls">',
                        '<input type="text" name="borderRadius" tabindex="6" class="input-micro" placeholder="1" value="$[properties.borderRadius]">',
                    '</div>',
                '</div>',
            '</div>',
            '<div class="tab-pane[if properties.activetab.styles] active[endif]" id="tab-styles">',
                '<div class="control-group">',
                    '<label class="control-label">Наличие</label>',
                    '<div class="controls">',
                        '<label class="checkbox">',
                            '<input type="checkbox" name="stroke" tabindex="7" data-control="stroke" value="$[properties.stroke|1]"[if properties.stroke] checked[endif][ifdef properties.stroke][else] checked[endif]>',
                            'обводки',
                        '</label>',
                        '<label class="checkbox">',
                            '<input type="checkbox" name="fill" tabindex="8" data-control="fill" value="$[properties.fill|1]"[if properties.fill] checked[endif][ifdef properties.fill][else] checked[endif]>',
                            'заливки',
                        '</label>',
                    '</div>',
                '</div>',
                '<div class="control-group">',
                    '<label class="control-label">Цвет заливки</label>',
                    '<div class="controls">',
                        '<input type="text" name="fillColor" tabindex="9" class="input-xlarge" placeholder="FFFFFFAA или rgba(255,0,0,1)" value="$[properties.fillColor]">',
                    '</div>',
                '</div>',
                '<div class="control-group">',
                    '<label class="control-label">Цвет линии</label>',
                    '<div class="controls">',
                        '<input type="text" name="strokeColor" tabindex="10" class="input-xlarge" placeholder="FFFFFFAA или rgba(255,0,0,1)" value="$[properties.strokeColor]">',
                    '</div>',
                '</div>',
                '<div class="control-group">',
                    '<label class="control-label">Толщина линии</label>',
                    '<div class="controls">',
                        '<input type="text" name="strokeWidth" tabindex="11" class="input-micro" placeholder="1" value="$[properties.strokeWidth]">',
                    '</div>',
                '</div>',
                '<div class="control-group">',
                    '<label class="control-label">Стиль линии</label>',
                    '<div class="controls">',
                        '<select class="input-xlarge" tabindex="12" name="strokeStyle">',
                            '<option value="solid">Сплошная линия</option>',
                            '<option value="dash">Тире</option>',
                            '<option value="dashdot">Длинное тире - короткое тире</option>',
                            '<option value="dot">Точки</option>',
                            '<option value="longdash">Длинные тире</option>',
                            '<option value="longdashdot">Очень длинное тире - точка</option>',
                            '<option value="longdashdotdot">Длинное тире - точка - точка</option>',
                            '<option value="shortdash">Короткие тире</option>',
                            '<option value="shortdashdot">Тире - точка</option>',
                            '<option value="shortdashdotdot">Тире - точка - точка</option>',
                            '<option value="shortdot">Точки через двойной интервал</option>',
                        '</select>',
                    '</div>',
                '</div>',
            '</div>'
        ].join(''), ymaps.util.extend({}, BaseFieldsetMethods, {
            onGeometryChange: function (e) {
                var geoObject = this.geoObject,
                    center = this.geometryFields.filter('[name=center]').val().split(',').map(Number),
                    width = Number(this.geometryFields.filter('[name=width]').val()),
                    height = Number(this.geometryFields.filter('[name=height]').val());

                geoObject.geometry
                    .setCenter(center)
                    .setWidth(width)
                    .setHeight(height);

                geoObject.properties.set({
                    center: center,
                    width: width,
                    height: height
                });
/*
                setTimeout(function () {
                    geoObject.properties.get('balloon').autoPan();
                }, 0);
                */
            }
        })),

        CircleFieldset: ymaps.templateLayoutFactory.createClass([
            '<div class="control-group">',
                '<label class="control-label">Координаты центра</label>',
                '<div class="controls">',
                    '<input class="input-xlarge" type="text" name="center" tabindex="3" value="$[properties.center]"/>',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Радиус в метрах</label>',
                '<div class="controls">',
                    '<input class="input-mini" type="text" name="radius" tabindex="4" value="$[properties.radius|0]"/>',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Наличие</label>',
                '<div class="controls">',
                    '<label class="checkbox">',
                        '<input type="checkbox" name="stroke" tabindex="5" data-control="stroke" value="1">',
                        'обводки',
                    '</label>',
                    '<label class="checkbox">',
                        '<input type="checkbox" name="fill" tabindex="6" data-control="fill" value="1">',
                        'заливки',
                    '</label>',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Цвет заливки</label>',
                '<div class="controls">',
                    '<input type="text" name="fillColor" tabindex="7" class="input-xlarge" placeholder="FFFFFFAA или rgba(255,0,0,1)" value="$[properties.fillColor]">',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Цвет линии</label>',
                '<div class="controls">',
                    '<input type="text" name="strokeColor" tabindex="8" class="input-xlarge" placeholder="FFFFFFAA или rgba(255,0,0,1)" value="$[properties.strokeColor]">',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Толщина линии</label>',
                '<div class="controls">',
                    '<input type="text" name="strokeWidth" tabindex="9" class="input-micro" placeholder="1" value="$[properties.strokeWidth]">',
                '</div>',
            '</div>',
            '<div class="control-group">',
                '<label class="control-label">Стиль линии</label>',
                '<div class="controls">',
                    '<select class="input-xlarge" tabindex="10" name="strokeStyle">',
                        '<option value="solid">Сплошная линия</option>',
                        '<option value="dash">Тире</option>',
                        '<option value="dashdot">Длинное тире - короткое тире</option>',
                        '<option value="dot">Точки</option>',
                        '<option value="longdash">Длинные тире</option>',
                        '<option value="longdashdot">Очень длинное тире - точка</option>',
                        '<option value="longdashdotdot">Длинное тире - точка - точка</option>',
                        '<option value="shortdash">Короткие тире</option>',
                        '<option value="shortdashdot">Тире - точка</option>',
                        '<option value="shortdashdotdot">Тире - точка - точка</option>',
                        '<option value="shortdot">Точки через двойной интервал</option>',
                    '</select>',
                '</div>',
            '</div>'
        ].join(''), ymaps.util.extend({}, BaseFieldsetMethods, {
            onGeometryChange: function (e) {
                var geoObject = this.geoObject,
                    center = this.geometryFields.filter('[name=center]').val().split(',').map(Number),
                    radius = Number(this.geometryFields.filter('[name=radius]').val());

                geoObject.geometry
                    .setCoordinates(center)
                    .setRadius(radius);

                geoObject.properties.set({
                    center: center,
                    radius: radius
                });

                setTimeout(function () {
                    geoObject.properties.get('balloon').autoPan();
                }, 0);
            }
        }))
    };

    function GeoObjectEditorView() {}

    (function () {
        this.getLayout = function (key) {
            return views[key.charAt(0).toUpperCase() + key.substring(1)];
        };
    }).call(GeoObjectEditorView.prototype);

    return GeoObjectEditorView;
});
