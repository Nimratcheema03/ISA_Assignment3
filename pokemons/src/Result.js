import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Pagination from './Pagination';
import jwt_decode from "jwt-decode";
import './Result.css';
import Modal from './Modal';

function Result({ types, name, pokemons, setPokemons, PAGE_SIZE, currentPage, setCurrentPage, accessToken, setAccessToken, refreshToken }) {
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [imageUrls, setImageUrls] = useState({});

  const handleCardClick = async(pokemon) => {
    setSelectedPokemon(pokemon);
    await getImageUrl(pokemon.id);
    setSelectedImageUrl(imageUrls[pokemon.id]);
  };

  const closeModal = () => {
    setSelectedPokemon(null);
  };

  const axiosJWT = axios.create()

  axiosJWT.interceptors.request.use(
    async (config) => {
      const decodedToken = jwt_decode(accessToken);
      if (decodedToken.exp < Date.now() / 800) {
        const res = await axios.get("http://localhost:6001/requestNewAccessToken", {
          headers: {
            'auth-token-refresh': refreshToken
          }
        });
        setAccessToken(res.headers['auth-token-access'])
        config.headers["auth-token-access"] = res.headers['auth-token-access'];
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [name, types]);

  useEffect(() => {
    async function fetchTypes() {
      const res = await axiosJWT.get('http://localhost:6001/api/v1/allpokemons', {
        headers: {
          'auth-token-access': accessToken
        }
      });
      const pokemonArray = Object.values(res.data);
      setPokemons(pokemonArray);
    }
    fetchTypes();
  }, []);
  const filteredPokemons = pokemons?.filter(
    (pokemon) => types?.every((type) => pokemon.type?.includes(type)) && pokemon?.name?.english.toLowerCase().includes(name?.toLowerCase())
  );
  const currentPokemons = filteredPokemons?.slice(startIndex, endIndex);
  const getImageUrl = async (id) => {
    if (!imageUrls[id]) {
      const response = await axiosJWT.get(`http://localhost:6001/pokemonImage/${id}`, {
        headers: {
          'auth-token-access': accessToken
        }
      });
      setImageUrls(prevUrls => ({
        ...prevUrls,
        [id]: response.data
      }));
    }
  };
  
  useEffect(() => {
    currentPokemons?.forEach((pokemon) => {
      getImageUrl(pokemon.id);
    });
  }, [currentPokemons]);
  return (
    <div>
    <div className="result-container">
      {currentPokemons?.map((pokemon) => {
        return (
          <div key={pokemon.id} className="pokemon-card" onClick={() => handleCardClick(pokemon)}>
            {imageUrls[pokemon.id] && (
                <img
                  src={imageUrls[pokemon.id]}
                  alt={pokemon.name.english}
                />
              )}
            <div className="pokemon-name">{pokemon.name.english}</div>
          </div>
        );
      })}
    </div>
    {/* Display modal if a pokemon is selected */}
    {selectedPokemon && (
  <Modal selectedPokemon={selectedPokemon} closeModal={closeModal} imageUrl={selectedImageUrl} />
)}

    <div> <Pagination pokemons={filteredPokemons} PAGE_SIZE={PAGE_SIZE} setCurrentPage={setCurrentPage} currentPage={currentPage} /></div>
    </div>
  );
}

export default Result;
