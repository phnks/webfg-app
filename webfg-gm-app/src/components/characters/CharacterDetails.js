import React from "react";
import "./CharacterDetails.css";

const CharacterDetails = ({ character }) => {
  return (
    <div className="section character-details">
      <h3>Character Details</h3>
      <table>
        <tbody>
          <tr>
            <td>ID:</td>
            <td>{character.characterId}</td>
          </tr>
          <tr>
            <td>Name:</td>
            <td>{character.name}</td>
          </tr>
          <tr>
            <td>Category:</td>
            <td>{character.characterCategory}</td>
          </tr>
          <tr>
            <td>Will:</td>
            <td>{character.will}</td>
          </tr>
          {character.special && character.special.length > 0 && (
            <tr>
              <td>Special:</td>
              <td>{character.special.join(", ")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CharacterDetails;