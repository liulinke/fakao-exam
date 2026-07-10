// 进阶题库装载器：按科目引入全部分片（新增科目文件后在此登记）
(function () {
  var files = ["xingfa", "xingsu", "xingzheng", "falixue", "xianfa", "guojifa", "sifazhidu", "falvshi",
    "minfa", "minsu", "shangfa", "jingjifa", "zhishichanquan", "guojisifa", "guojijingjifa", "huanjing", "laodong"];
  files.forEach(function (f) {
    document.write('<script src="data/bank_hard/' + f + '.js"><\/script>');
  });
  // 加载补充题目（追加到已有科目中）
  document.write('<script src="data/bank_hard/_extra.js"><\/script>');
})();
