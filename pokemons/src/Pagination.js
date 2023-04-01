import React from 'react'
import "./Pagination.css"

const Pagination = ({pokemons, PAGE_SIZE, setCurrentPage, currentPage}) => {
    const totalPages = Math.ceil(pokemons.length / PAGE_SIZE);
    const buttonRange = 1;
    const startPage = Math.max(1, currentPage - buttonRange)-1;
    const endPage = Math.min(totalPages, currentPage + buttonRange);
    return (
      <div className="pagination-container">
          {
            (currentPage !== 1)&&<button onClick={()=>setCurrentPage(currentPage-1)} className="pagination-button">Prev</button>
          }
          {
               Array.from({ length:endPage - startPage  }, (element , index) => index+startPage).map((number)=>(
                  <button key = {number+1} onClick={()=>setCurrentPage(number+1)}
                  className = {currentPage === number+1 ? "pagination-button buttonActive": "pagination-button"}>
                      {number+1}
                  </button>
               ))
          }
          {
        (currentPage !== Math.ceil(pokemons.length/PAGE_SIZE))&&<button onClick={()=>setCurrentPage(currentPage+1)} className="pagination-button">Next</button>
          }
      </div>
    )
  }
  
  export default Pagination;
  