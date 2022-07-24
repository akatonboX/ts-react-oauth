import { Link } from "react-router-dom";
import { NavigateComponent } from "../component/navigateComponent ";
import { useOauthContext } from "../lib/oauthProvider";

export const MainPage = function(
  props: {

  }
){
  return <>
    メインページ
    <NavigateComponent/>
  </>;
}
