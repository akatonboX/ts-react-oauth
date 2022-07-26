import { Link } from "react-router-dom";
import { NavigateComponent } from "../component/navigateComponent ";
import { useOauthContext } from "../lib/oauthProvider";

export const TopPage = function(
  props: {

  }
){
  var oauthContext = useOauthContext();
  return <>
  
    {oauthContext.noLoggedIn != null ? 
      <><button onClick={e => {e.preventDefault();oauthContext.noLoggedIn?.login("/main");}}>login</button><br/>
      </>
      : <></>
    }
    {oauthContext.loggedIn != null ? 
      <><button onClick={e => {e.preventDefault();oauthContext.loggedIn?.logout();}}>logout</button><br/></>
      : <></>
    }
    <NavigateComponent/>
  </>;
}
