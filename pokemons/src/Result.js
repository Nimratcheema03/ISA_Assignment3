import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Pagination from './Pagination';
import './Result.css';
import Modal from './Modal';
function Result({ types, name, pokemons, setPokemons, PAGE_SIZE, currentPage, setCurrentPage }) {
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  const handleCardClick = (pokemon) => {
    setSelectedPokemon(pokemon);
  };

  const closeModal = () => {
    setSelectedPokemon(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [name, types]);

  useEffect(() => {
    async function fetchTypes() {
      const res = await axios.get('https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json');
      console.log(res.data);
      setPokemons(res.data);
    }
    fetchTypes();
  }, []);

  const filteredPokemons = pokemons.filter(
    (pokemon) => types.every((type) => pokemon.type.includes(type)) && pokemon.name.english.toLowerCase().includes(name.toLowerCase())
  );

  const currentPokemons = filteredPokemons.slice(startIndex, endIndex);

  return (
    <div>
    <div className="result-container">
      {currentPokemons.map((pokemon) => {
        return (
          <div key={pokemon.id} className="pokemon-card" onClick={() => handleCardClick(pokemon)}>
            <img
              src={`https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/${pokemon.id
                .toString()
                .padStart(3, '0')}.png`}
              alt={pokemon.name.english}
            />
            <div className="pokemon-name">{pokemon.name.english}</div>
          </div>
        );
      })}
    </div>
    {/* Display modal if a pokemon is selected */}
    {selectedPokemon && (
        <Modal selectedPokemon={selectedPokemon} closeModal={closeModal} />
      )}
    <div> <Pagination pokemons={filteredPokemons} PAGE_SIZE={PAGE_SIZE} setCurrentPage={setCurrentPage} currentPage={currentPage} /></div>
    </div>
  );
}

export default Result;
