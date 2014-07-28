function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

var BoardModel = Backbone.Model.extend({
    urlRoot: 'http://localhost:8080/new/10'
});

var AppView = Backbone.View.extend({
  el: '#container',

  initialize: function(){
    this.listenTo(this.model, 'change', this.render);
    this.model.fetch();
  },

  render: function(){
    console.log(this.model);
    var states = this.model.attributes.States;
    var html = "<table>";
    for (var row = 0; row < states.length; row++) {
      html += "<tr>";
      for (var cell = 0; cell < states[row].length; cell++) {
        html += "<td class='";
        if (states[row][cell]) {
          html += "alive";
        } else {
      html += "dead";
        }
        html += "''></td>";
      }
      html += "</tr>";
  }
  html += "</table>";
    this.$el.html(html);
    sleep(100);
    this.model.save();
  }
});

var boardModel = new BoardModel();
var appView = new AppView({model: boardModel});