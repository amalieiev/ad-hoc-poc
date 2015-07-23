/**
 * Created by Artem.Malieiev on 6/18/2015.
 */
define(function (require) {
    var Backbone = require('backbone'),
        _ = require('underscore'),
        TableListItemViewTemplate = require('text!template/TableListItemViewTemplate.html');

    return Backbone.View.extend({
        tagName: 'li',
        events: {
            'dragstart': 'onDragStart'
        },
        render: function () {
            this.$el.html(_.template(TableListItemViewTemplate)(this.model.toJSON()));
            return this;
        },
        onDragStart: function () {
            Tamanoir.trigger('tables:table:dragstart', this.model);
        }
    });
});