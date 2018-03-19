import moment from 'moment';
import request from 'request-promise';
import API_KEYS from '../../config';

const API_KEY = API_KEYS.WU_KEY;
const COLORS = ['#ff6138', '#e2e28b', '#beeb9f', '#79bd8f', '#00a388'];

const API_ROUTE_CONDITIONS = `http://api.wunderground.com/api/{key}/conditions/q/{zip}.json`;
const API_ROUTE_FORECAST = `http://api.wunderground.com/api/{key}/forecast/q/{zip}.json`;
const API_ROUTE_FORECAST_10 = `http://api.wunderground.com/api/{key}/forecast10day/q/{zip}.json`;

const forecastTrigger = `^!(?:forecast|fc)(?: ([0-9]{5}))?$`;
const weatherTrigger = `^!weather(?: ([0-9]{5}))?$`;

const sources = ['ambient'];

const buildPromises = (routes, zip) => {
  const promises = [];

  routes.forEach(route => {
    const args = {
      method: 'GET',
      uri: route.format({ key: API_KEY, zip }),
      json: true,
    };

    promises.push(request(args));
  });

  return promises;
};

const skill = ({ controller }) => {
  //
  //
  // Forecast
  controller.hears(forecastTrigger, sources, (bot, message) => {
    if (!message.match[1]) { bot.reply(message, `Supply me a zip code, bunhead! :neutral_face:`); return; }

    const { user } = message;
    const zip = message.match[1];

    const API_ROUTES = [
      API_ROUTE_CONDITIONS,
      API_ROUTE_FORECAST_10,
    ];

    // Build up promises from API_ROUTES for Promise.all()
    const promises = buildPromises(API_ROUTES, zip);

    // Expects Promises in order of [conditions, forecast];
    // MUST UPDATE if changing API_ROUTES or adding new ones
    Promise.all(promises).then(response => {
      // Parse Response
      const [{ current_observation: conditions }, { forecast }] = response;
      let { simpleforecast: { forecastday: forecasts }, txt_forecast: { forecastday: forecastsTxt } } = forecast;
      forecasts = forecasts.splice(0, 5);
      forecastsTxt = forecastsTxt.splice(0, 5);

      // Get Values We Want
      const timestamp = Math.floor(Date.now() / 1000);
      const { image: { url, title, link } } = conditions;
      const { display_location: { city } } = conditions;

      const attachments = [];
      const baseAttachment = {
        fallback: `5-Day Forecast for "${zip}"`,
        author_name: title,
        author_link: link,
        author_icon: url,
        color: COLORS[COLORS.length - 1],
        title: `5-Day Forecast for ${city}`,
        pretext: `*5-Day Forecast for "${zip}" via <@${user}>*`,
        text: `Here's the 5-day forecast for ${city} as of ${moment().format('h:mm a')}.`,
        ts: timestamp,
        mrkdwn_in: ['pretext'],
      };

      attachments.push(baseAttachment);

      forecasts.forEach((currentForecast, i) => {
        const txtForecast = forecastsTxt[i];
        const { high: { fahrenheit: high }, low: { fahrenheit: low } } = currentForecast;

        const attachment = {
          title: `${currentForecast.date.weekday} Forecast`,
          text: txtForecast.fcttext,
          thumb_url: currentForecast.icon_url,
          color: COLORS[i % COLORS.length],
          fields: [{
            title: 'High',
            value: `${high}°`,
            short: true,
          }, {
            title: 'Low',
            value: `${low}°`,
            short: true,
          }],
          mrkdwn_in: ['pretext'],
        };

        attachments.push(attachment);
      });

      bot.reply(message, {
        attachments,
      });
    }).catch(() => bot.reply(message, `Something went wrong while querying the weather. :face_with_head_bandage:`));
  });


  //
  //
  // Weather
  controller.hears(weatherTrigger, sources, (bot, message) => {
    if (!message.match[1]) { bot.reply(message, `Supply me a zip code, bunhead! :neutral_face:`); return; }

    const { user } = message;
    const zip = message.match[1];

    const API_ROUTES = [
      API_ROUTE_CONDITIONS,
      API_ROUTE_FORECAST,
    ];

    // Build up promises from API_ROUTES for Promise.all()
    const promises = buildPromises(API_ROUTES, zip);

    // Expects Promises in order of [conditions, forecast];
    // MUST UPDATE if changing API_ROUTES or adding new ones
    Promise.all(promises).then(response => {
      // Parse Response
      const [{ current_observation: conditions }, { forecast }] = response;
      const { simpleforecast: { forecastday: [todayForecast] } } = forecast;

      // Get Values We Want
      const timestamp = Math.floor(Date.now() / 1000);
      const { image: { url, title, link } } = conditions;
      const { temp_f: currentTemp, display_location: { city }, weather, icon_url: weatherIcon } = conditions;
      const { high: { fahrenheit: high }, low: { fahrenheit: low } } = todayForecast;

      bot.reply(message, {
        attachments: [
          {
            fallback: `Weather for "${zip}" - Current: ${currentTemp} - High: ${high} - Low: ${low}`,
            author_name: title,
            author_link: link,
            author_icon: url,
            title: `Weather for ${city}`,
            pretext: `*Weather search for "${zip}" via <@${user}>*`,
            text: `It's currently ${currentTemp}° and ${weather} in ${city}. The estimated temperatures for today are a high of ${high}° and a low of ${low}°.`,
            thumb_url: weatherIcon,
            ts: timestamp,
            fields: [{
              title: 'Current Temperature',
              value: `${currentTemp}°`,
              short: true,
            }, {
              title: 'Current Conditions',
              value: weather,
              short: true,
            }, {
              title: 'High Temperature',
              value: `${high}°`,
              short: true,
            }, {
              title: 'Low Temperature',
              value: `${low}°`,
              short: true,
            }],
            mrkdwn_in: ['pretext'],
          },
        ],
      });
    }).catch(() => bot.reply(message, `Something went wrong while querying the weather. :face_with_head_bandage:`));
  });
};

export default skill;
