import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { FormattedMessage, FormattedDate, useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";

import { Header, Main } from "../../components/page";

import "./Changelog.css";

export const Changelog = () => {
  const location = useLocation();
  const intl = useIntl();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>
          {`Warhammer Fantasy Builder | ${intl.formatMessage({
            id: "footer.changelog",
          })}`}
        </title>
        <link rel="canonical" href="https://old-world-builder.com/changelog" />
      </Helmet>

      <Header headline="Warhammer Fantasy Builder" hasMainNavigation hasHomeButton />

      <Main compact className="changelog">
        <h2 className="page-headline">
          <FormattedMessage id="changelog.title" />
        </h2>

        <hr />

        <h3>v0.1</h3>
        <p>
          <time>
            <i>
              <FormattedDate
                value={new Date("2026-02-16 11:11:11")}
                month="long"
                day="2-digit"
                year="numeric"
              />
            </i>
          </time>
        </p>
        <ul className="changelog__list">
          <li>
            <FormattedMessage
              id="changelog.change0"
            />
          </li>
        </ul>
      </Main>
    </>
  );
};
