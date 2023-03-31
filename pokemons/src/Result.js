import React, {useEffect} from 'react'
import axios from 'axios';

function Result({types, name, pokemons, setPokemons, PAGE_SIZE, currentPage, setCurrentPage}) {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    useEffect(() => {
        setCurrentPage(1);
      }, [name, types]);
    useEffect(()=>{
        async function fetchTypes(){
            const res = await axios.get('https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json')
            console.log(res)
            setPokemons(res.data)
        }
        fetchTypes()

    }, [])
    const filteredPokemons = pokemons.filter(
        (pokemon) => types.every((type) => pokemon.type.includes(type)) && pokemon.name.english.toLowerCase().includes(name.toLowerCase())
    );
    const curretpokemons = filteredPokemons.slice(startIndex, endIndex)
  return (
    <div>
        {
        curretpokemons.map(pokemon => {
         
            return (
             <div key={pokemon.id}>
              <img src ={`https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/${pokemon.id.toString().padStart(3, '0')}.png`} alt={pokemon.name.english} width="10%" height="10%"></img>
             <h1>{pokemon.name.english}</h1>
           </div>)
         })
       
        }
    </div>
  )
}

export default Result