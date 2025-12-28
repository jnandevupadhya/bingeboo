import MediaRemote from "@/components/MediaRemote";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>BingeBoo - Netflix remote</title>
        <meta
          name="description"
          content="A cute floating media remote for watching shows together"
        />
      </Helmet>

      <MediaRemote />
    </>
  );
};

export default Index;
