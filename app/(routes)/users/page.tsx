import axios from "axios";
import { getServerSession } from "next-auth"

const UsersPage = async() => {

    const session = await getServerSession();

    // console.log(session?.user);

    // const users = await axios.get("http://localhost:8000/api/users/", {
    //     headers: {
    //         Authorization: `Bearer ${session.access_token}`
    //     }
    // });

    // console.log(users)

  return (
    <div>UsersPage</div>
  )
}

export default UsersPage