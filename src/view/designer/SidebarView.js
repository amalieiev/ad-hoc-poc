/**
 * Created by Artem.Malieiev on 6/16/2015.
 */
define(function (require) {
    var Backbone = require('backbone'),
        $ = require('jquery'),
        _ = require('underscore'),
        SidebarViewTemplate = require('text!template/designer/SidebarViewTemplate.html');

    require('css!styles/designer/sidebar');

    return Backbone.View.extend({
        events: {
            'click li': 'onItemClick'
        },
        initialize: function () {
            this.listenTo(this.collection, 'reset', this.render);
        },
        render: function () {
            this.$el.html(_.template(SidebarViewTemplate)({
                categories: this.collection.getCategoriesNames(),
                numbers: this.collection.getNumbersNames()
            }));
            this.calculateSidebarHeight();
            return this;
        },

        calculateSidebarHeight: function () {
            var availableHeight = $('body').height() - 85;
            this.$el.find('ul').height(availableHeight / 2 - 40);
        },
        onItemClick: function (event) {
            console.log('sidebar item click');
        }
    });
});