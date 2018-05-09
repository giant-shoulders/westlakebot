// Slack
exports.USER_TAG = '<@([a-zA-Z0-9][a-zA-Z0-9._-]*)>';
exports.CHANNEL_TAG = '<#([a-zA-Z0-9]*)(?:\\|[a-zA-Z0-9_-]*)>';

// General
exports.URL = '<((?:https?:\\/\\/)?(?:[\\da-z\\.-]+)\\.(?:[a-z\\.]{2,6})(?:[\\/\\w \\.-]*)*\\/?.+)>';

// Color
exports.HEX = '(#(?:[\\da-fA-F]{3}|[\\da-fA-F]{6}))';
exports.RGB = '(?:rgb\\()? *([\\d]{1,3}) *,? *([\\d]{1,3}) *,? *([\\d]{1,3})(?:\\)?)';
exports.HSL = '(?:hsl\\()? *([\\d]{1,3}) *,? *([\\d]{1,3}) *,? *([\\d]{1,3})(?:\\)?)';
