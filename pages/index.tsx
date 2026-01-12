import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("time", "desc"));
    onSnapshot(q, snap => {
      const list:any[] = [];
      snap.forEach(doc => list.push(doc.data()));
      setPosts(list);
    });
  }, []);

  const createPost = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, "posts"), {
      user: "Ajia",
      text,
      time: serverTimestamp()
    });
    setText("");
  };

  return (
    <div>
      <h2>Nexus Social</h2>

      <textarea
        placeholder="What's happening?"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button onClick={createPost}>Post</button>

      {posts.map((p, i) => (
        <div key={i}>
          <b>{p.user}</b>
          <p>{p.text}</p>
        </div>
      ))}
    </div>
  );
}
