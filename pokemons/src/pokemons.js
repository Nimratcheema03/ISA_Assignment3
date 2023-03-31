import React from 'react'

import {useState } from "react";
import Filter from './Filter';
import Results from './Result';
function Pokemons() {
  const [types, setTypes] = useState([]);
  const [name, setName] = useState('');
  const [pokemons, setPokemons] = useState([])
  const PAGE_SIZE= 10
  const [currentPage, setCurrentPage] = useState(1);
  return (
   <div>
      <Filter 
      types = {types} 
      setTypes={setTypes}
      setName={setName}
      name = {name}
      >
      </Filter>
      <Results types={types} name ={name} pokemons={pokemons} setPokemons={setPokemons} PAGE_SIZE = {PAGE_SIZE}
    currentPage = {currentPage} setCurrentPage={setCurrentPage}></Results>
   </div>
  )
}

export default Pokemons