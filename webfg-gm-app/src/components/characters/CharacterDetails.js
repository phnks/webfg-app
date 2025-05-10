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

        </tbody>
      </table>
    </div>
  );
};

export default CharacterDetails; 