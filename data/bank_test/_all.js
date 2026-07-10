// 题库装载器：按科目引入全部分片（新增科目文件后在此登记）
(function () {
  var files = ["xingfa", "xingsu", "xingzheng", "falixue", "xianfa", "guojifa", "sifazhidu", "falvshi",
    "minfa", "minsu", "shangfa", "jingjifa", "zhishichanquan", "guojisifa", "guojijingjifa", "huanjing", "laodong"];
  files.forEach(function (f) {
    document.write('<script src="data/bank/' + f + '.js"><\/script>');
  });
})();
