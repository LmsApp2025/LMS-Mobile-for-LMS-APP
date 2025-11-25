import useUser from "@/hooks/auth/useUser";
import { Redirect } from "expo-router";
import Loader from "@/components/loader/loader";

export default function TabsIndex() {
  const { loading, user } = useUser();
  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <Redirect href={!user ? "/(routes)/onboarding" : "/(tabs)" } />
      )}
    </>
  );
}

// // In: new-client/app/index.tsx

// import useUser from "@/hooks/auth/useUser";
// import { Redirect } from "expo-router";
// import Loader from "@/components/loader/loader";

// export default function RootIndex() {
//   const { loading, user } = useUser();

//   if (loading) {
//     return <Loader />;
//   }

//   // If there is NO user, go to onboarding.
//   // If there IS a user, go to the main tabs.
//   return <Redirect href={!user ? "/(routes)/onboarding" : "/(tabs)"} />;
// }


