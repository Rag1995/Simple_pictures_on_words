module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/Simple_pictures_on_words/'
    : '/',
  chainWebpack: config => {
      config
          .plugin('html')
          .tap(args => {
              args[0].title = "簡單圖片上字";
              return args;
          })
  }
}
