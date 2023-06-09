import React from 'react'
import "./Result.css"
function Modal({ selectedPokemon, closeModal, imageUrl }) {
    return (
      <div className="modal">
        <div className="modal-content">
        <button className="close-btn" onClick={closeModal}>X</button>
          <h2>{selectedPokemon.name.english}</h2>
          <img
                src={imageUrl}
                alt={selectedPokemon.name.english}
              />
                <table>
            <tbody>
            <tr>
                <td>ID</td>
                <td>{selectedPokemon.id}</td>
              </tr>
              <tr>
                <td>Type</td>
                <td>{selectedPokemon.type.join(', ')}</td>
              </tr>
              <tr>
                <td>HP</td>
                <td>{selectedPokemon.base.HP}</td>
              </tr>
              <tr>
                <td>Attack</td>
                <td>{selectedPokemon.base.Attack}</td>
              </tr>
              <tr>
                <td>Defense</td>
                <td>{selectedPokemon.base.Defense}</td>
              </tr>
              <tr>
                <td>Sp. Attack</td>
                <td>{selectedPokemon.base['Speed Attack']}</td>
              </tr>
              <tr>
                <td>Sp. Defense</td>
                <td>{selectedPokemon.base['Speed Defense']}</td>
              </tr>
              <tr>
                <td>Speed</td>
                <td>{selectedPokemon.base.Speed}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

export default Modal