function isYoutubeEmbed(url) {
  const regex = /^https:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]+(\?.*)?$/;
  return regex.test(url);
}

module.exports = {
    isYoutubeEmbed
}