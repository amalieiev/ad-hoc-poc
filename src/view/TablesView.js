/**
 * Created by Artem.Malieiev on 6/19/2015.
 */
define(function (require) {
    var Backbone = require('backbone'),
        $ = require('jquery'),
        _ = require('underscore'),
        TableListItemView = require('view/TableListItemView'),
        TablesViewTemplate = require('text!template/TablesViewTemplate.html');

    return Backbone.View.extend({
        className: 'tables-view',
        template: _.template(TablesViewTemplate),
        initialize: function (config) {
            this.config = config || {};
            this._subviews = [];
            this.listenTo(this.collection, 'reset', this.render);
        },
        render: function () {
            this.$el.html(this.template({database: this.config.database}));
            this.collection.each(this.addTable, this);
            this.calculateHeight();
            return this;
        },
        addTable: function (tableModel) {
            var view = new TableListItemView({model: tableModel})
            this._subviews.push(view);
            this.$el.find('ul').append(view.render().$el);
        },
        calculateHeight: function () {
            setTimeout(function () {
                var topSectionHeight = $('.sidebar').height(),
                    titleHeight = this.$('.title').height();

                this.$('ul').height(topSectionHeight - titleHeight);
            }.bind(this), 0);
        },
        remove: function () {
            _.invoke(this._subviews, 'remove');
            Backbone.View.prototype.remove.apply(this, arguments);
        }
    });
});