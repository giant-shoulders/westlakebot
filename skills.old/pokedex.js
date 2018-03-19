import changeCase from 'change-case';
import Pokedex from 'pokedex-promise-v2';
import { arrayRandom } from '../../utils';

const pokedex = new Pokedex();
const sources = ['ambient', 'direct_mention', 'direct_message'];
const triggers = ['^!pokedex(?: ([a-zA-Z-. ]+))$'];


const skill = ({ controller }) => {
  controller.hears(triggers, sources, (bot, message) => {
    if (!message.match[1]) {
      bot.reply(message, `What pokemon should I look for?`);
      return;
    }

    const [, title] = message.match;
    const { user } = message;

    const pokemon = pokedex.getPokemonByName(title.replace(/\s+/g, '-').replace(/\./g, ''));
    const pokemonSpecies = pokemon.then(pokemonResult =>
      pokedex.getPokemonSpeciesByName(pokemonResult.species.name)
    );

    Promise.all([pokemon, pokemonSpecies]).then(value => {
      const [pokemonResult, speciesResult] = value;

      const abilities = pokemonResult.abilities.map(elem => changeCase.title(elem.ability.name)).join(', ');
      const filteredPokedexText = speciesResult.flavor_text_entries.filter((element) => element.language.name === 'en');
      const name = changeCase.title(pokemonResult.name);
      const pokedexText = arrayRandom(filteredPokedexText).flavor_text;
      const timestamp = Math.floor(Date.now() / 1000);
      const types = pokemonResult.types.map(elem => changeCase.title(elem.type.name)).join(', ');

      bot.reply(message, {
        attachments: [
          {
            color: '#36a64f',
            fallback: `${name} - ${pokedexText}`,
            fields: [{
              short: true,
              title: 'Type',
              value: types,
            }, {
              short: true,
              title: 'Abilities',
              value: abilities,
            }, {
              short: true,
              title: 'Height',
              value: `${pokemonResult.height / 10} m`,
            }, {
              short: true,
              title: 'Weight',
              value: `${pokemonResult.weight / 10} kg`,
            }],
            image_url: pokemonResult.sprites.front_default,
            pretext: `Pokedex Search for "${title}" via <@${user}>`,
            text: pokedexText,
            title: name,
            ts: timestamp,
          },
        ],
      });
    }).catch(() => bot.reply(message, `There was a problem finding: ${title}.`));
  });
};

export default skill;
