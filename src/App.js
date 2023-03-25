import { useState } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';
import { NFTStorage } from "nft.storage";

function App() {
  const [prompt, setPrompt] = useState(" ");
  console.log(prompt);
  const [imageBlob, setImageBlob] = useState(null)
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [minted, setMinted] = useState(false);
	console.log(prompt);

  const cleanupIPFS = (url) => {
    if(url.includes("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
  }

  const generateArt = async () => {
    setLoading(true)
    try {
			const response = await axios.post(
				`https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`,
				{
					headers: {
						Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE}}`,
					},
					method: "POST",
					inputs: prompt,
				},
				{ responseType: "blob" }
			);
			// convert blob to a image file type
			const file = new File([response.data], "image.png", {
				type: "image/png",
			});
			console.log(file);
			setFile(file);
			console.log(response);
			const url = URL.createObjectURL(response.data);
			// console.log(url)
			console.log(url);
			setImageBlob(url);
		} catch (err) {
			console.log(err);
      setError(true)
		} finally {
      setLoading(false)
    }
	};

  const uploadArtToIpfs = async () => {
    try {

      const nftstorage = new NFTStorage({
				token: process.env.REACT_APP_NFT_STORAGE,
			})

      const store = await nftstorage.store({
        name: "AI NFT",
        description: "AI generated NFT",
        image: file
      })
      console.log(store)
      return cleanupIPFS(store.data.image.href)

    } catch(err) {
      console.log(err)
      return null
    }
  }

  const mintNft = async () => {
    try {
      const imageURL = await uploadArtToIpfs();
  
      // mint as an NFT on nftport
      const response = await axios.post(
        `https://api.nftport.xyz/v0/mints/easy/urls`,
        {
          file_url: imageURL,
          chain: "polygon",
          name: "Sample NFT",
          description: "Build with NFTPort!",
          mint_to_address: "0x40808d4730aeAAfb44465c507499CB8EE690497b",
        },
        {
          headers: {
            Authorization: process.env.REACT_APP_NFT_PORT,
          }
        }
      );
      const data = await response.data;
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };
  

  console.log(name)
  console.log(description)
  console.log(address)


  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <h1 className='text-4xl font-extrabold'>Make Your Own AI art</h1>
      <div className="flex flex-col items-center justify-center">
      <div className="flex space-x-4  items-center justify-center gap 4">
        <input className="flex space-x-4 border-2 border-black rounded-md p-2"
        onChange={(e) => setPrompt(e.target.value)}
        type="text"
        placeholder="Enter a prompt"
        />
        <button onClick={generateArt} className="bg-black text-white rounded-md p-2">
          Next
          </button>
          {loading && <p>Loading...</p>}
      </div>
      {
        imageBlob && (
          <div className="flex flex-col gap-4 items-center justify-center">
        <img className="w-1/2" src={imageBlob} alt="AI generated art" />
        <button
			onClick={uploadArtToIpfs}
			className="bg-black text-white rounded-md p-2">
			Upload to IPFS
		</button>
    </div>
      )}
    </div>
    </div>
  );
}

export default App;
