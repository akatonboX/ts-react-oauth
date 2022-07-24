import { Link } from "react-router-dom";

export const NavigateComponent = function(
  props: {

  }
){

  return <>

    <br/>
    <Link to="/">top page</Link><br />
    <Link to="/main">main page</Link><br />
    <Link to="/sub">sub page</Link><br />

  </>;
}
